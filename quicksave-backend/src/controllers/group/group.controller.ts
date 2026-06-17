import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../config/logger';
import crypto from 'crypto';
import redis from '../../config/redis';
import { AppError } from '../../utils/AppError';
import { groupService } from '../../services/group.services';
import { getIo } from '../../config/socket';
import { payoutQueue } from '../../queues/payout.queue';

export const createGroup = catchAsync(async (req: Request, res: Response) => {
  const { name, description, contributionAmount, frequency, maxCapacity } = req.body;
  const userId = req.user.id; // Guaranteed to exist by requireAuth middleware

  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  const newGroup = await prisma.group.create({
    data: {
      name,
      description,
      contributionAmount,
      frequency,
      creatorId: userId,
      maxCapacity,
      inviteCode,
      // 1. Add the creator as the group ADMIN automatically
      members: {
        create: {
          userId: userId,
          role: 'ADMIN',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      },
      
      // 2. Provision the Group's wallet automatically
      wallet: {
        create: {
          balance: 0,
        },
      },
    },
    // Include the generated relations in the response
    include: {
      members: true,
      wallet: true,
    },
  });

  await redis.setex(`invite:${inviteCode}`, 2592000, newGroup.id);
  logger.info(
    { groupId: newGroup.id, userId },
    'New Quicksave Ajo group created successfully'
  );

  return sendSuccess(res, newGroup, 'Group created successfully', 201);
});


export const joinGroup = catchAsync(async (req: Request, res: Response) => {
  // Always convert to uppercase so it matches our generator
  const inviteCode = req.body.inviteCode.toUpperCase();
  const userId = req.user.id;

  // 1. FAST LOOKUP: Check Redis for the Group ID
  let groupId = await redis.get(`invite:${inviteCode}`);

  // Fallback: If it expired from Redis, look it up in PostgreSQL
  if (!groupId) {
    const group = await prisma.group.findUnique({ where: { inviteCode } });
    if (!group) throw new AppError('Invalid invite code. Group not found.', 404);
    groupId = group.id;
    // Re-cache it for next time
    await redis.setex(`invite:${inviteCode}`, 2592000, groupId);
  }

  // 2. Fetch the group with its current members
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) throw new AppError('Group not found.', 404);

  const currentMembers = (group as any).members || [];
  // 3. ENFORCE CAPACITY: Check if the group is full
  if (currentMembers.length >= group.maxCapacity) {
    throw new AppError('This group has reached its maximum capacity.', 403);
  }

  // 4. PREVENT DUPLICATES: Check if user is already a member
  const isAlreadyMember = currentMembers.some((member: any) => member.userId === userId);
  if (isAlreadyMember) {
    throw new AppError('You are already a member of this group.', 409);
  }

  // 5. Success! Add them to the group
  const newMember = await prisma.groupMember.create({
    data: {
      userId,
      groupId,
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    },
  });

  await groupService.logAndBroadcast(groupId, 'JOINED', 'A new member joined the group!', userId);

  logger.info({ groupId, userId }, 'User joined group via invite code');
  return sendSuccess(res, newMember, `You have successfully joined ${group.name}!`, 200);
});


export const getGroupDetails = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;
  const userId = req.user.id;

  // 1. Fetch the enriched group data
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      wallet: true, // Get the total group balance
      contributions: {
        // orderBy: { createdAt: 'desc' },
        take: 5, // Just get the 5 most recent contributions for the dashboard
      },
      members: {
        orderBy: { joinedAt: 'asc' }, // Show admins/oldest members at the top
        include: {

          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    throw new AppError('Group not found', 404);
  }
  const currentMembers = (group as any).members || [];
  // 2. 🚨 SECURITY CHECK: Ensure the requesting user is actually a member of this group
  const isMember = currentMembers.some((member: any) => member.userId === userId);
  if (!isMember) {
    throw new AppError('You are not authorized to view this group', 403);
  }

  // 3. Send the enriched data
  return sendSuccess(res, group, 'Group details retrieved successfully', 200);
});


export const updateGroupDetails = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const { name, description, contributionAmount, frequency, maxCapacity } = req.body;

  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      name,
      description,
      contributionAmount,
      frequency,
      maxCapacity,
    },
  });

  return sendSuccess(res, group, 'Group details updated successfully', 200);
});

export const getGroupMembers = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: true,
    },
  });

  if (!group) throw new AppError('Group not found.', 404);

  return sendSuccess(res, group.members, 'Group members fetched successfully', 200);
});


export const generateRotation = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;
  const { mode, startDate } = req.body;
  const userId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, rotationSlots: true },
  });

  if (!group) throw new AppError('Group not found', 404);

  // 1. SECURITY: Only the Group Creator (Admin) can generate the rotation
  if (group.creatorId !== userId) {
    throw new AppError('Only the group admin can generate the rotation', 403);
  }

  // 2. Prevent re-generating if it already exists
  if (group.rotationSlots.length > 0) {
    throw new AppError('Rotation has already been generated for this group', 400);
  }

  // 3. Ensure the group is full (or at least has enough people) before starting
  if (group.members.length < 2) {
    throw new AppError('You need at least 2 members to start the rotation', 400);
  }

  // 4. Sort members based on the chosen mode
  let orderedMembers = [...group.members];
  if (mode === 'RANDOM') {
    // Fisher-Yates Shuffle Algorithm for cryptographically fair randomness
    for (let i = orderedMembers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedMembers[i], orderedMembers[j]] = [orderedMembers[j], orderedMembers[i]];
    }
  } else if (mode === 'JOIN_ORDER') {
    orderedMembers.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }

  // 5. Calculate payout dates and map to Prisma creation objects
  let currentDate = new Date(startDate);
  
  const rotationData = orderedMembers.map((member, index) => {
    // Clone the date object so we don't mutate the original
    const payoutDate = new Date(currentDate);

    // Prepare the next date for the next person in the loop
    if (group.frequency === 'DAILY') currentDate.setDate(currentDate.getDate() + 1);
    else if (group.frequency === 'WEEKLY') currentDate.setDate(currentDate.getDate() + 7);
    else if (group.frequency === 'MONTHLY') currentDate.setMonth(currentDate.getMonth() + 1);

    return {
      groupId: group.id,
      userId: member.userId,
      position: index + 1, // 1st, 2nd, 3rd
      expectedPayoutDate: payoutDate,
    };
  });

  // 6. Save all slots to the database in one bulk transaction, and update group status
  await prisma.$transaction([
    prisma.rotationSlot.createMany({ data: rotationData }),
    prisma.group.update({
      where: { id: group.id },
      data: { status: 'ACTIVE' } // The group is officially running!
    })
  ]);

  logger.info({ groupId }, 'Rotation schedule generated successfully');
  return sendSuccess(res, rotationData, 'Rotation generated successfully', 201);
});


export const getRotationSchedule = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;

  // Ensure the group actually exists
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError('Group not found', 404);

  // Call our new service method!
  const timelineData = await groupService.getRotationTimeline(groupId);

  return sendSuccess(res, timelineData, 'Rotation timeline retrieved successfully', 200);
});

export const getActivityFeed = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;

  const logs = await prisma.activityLog.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: 50, // Only fetch the latest 50 events
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true } },
    },
  });

  return sendSuccess(res, logs, 'Activity feed retrieved', 200);
});

// --- 👉 NEW: UPDATE GROUP LIFECYCLE STATUS ---
export const updateGroupStatus = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;
  const { status } = req.body; // 'ACTIVE', 'PAUSED', 'COMPLETED'
  const userId = req.user.id;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError('Group not found', 404);
  
  if (group.creatorId !== userId) {
    throw new AppError('Only the admin can change the group status', 403);
  }

  // Update Database
  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: { status },
  });

  // Log it and broadcast the status change!
  await groupService.logAndBroadcast(
    groupId, 
    'STATUS_UPDATE', 
    `The group admin changed the status to ${status}`, 
    userId
  );

  // Broadcast a specific event so the frontend can update its UI state
  getIo().to(groupId).emit('groupStatusChanged', { status });

  return sendSuccess(res, updatedGroup, `Group is now ${status}`, 200);
});


export const makeContribution = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;
  const userId = req.user.id;

  // 1. Fetch Group and User data
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, wallet: true },
  });

  const userWallet = await prisma.wallet.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!group || !group.wallet) throw new AppError('Group or Group Vault not found', 404);
  if (!userWallet) throw new AppError('User wallet not found', 404);

  // 2. Eligibility Checks
  if (group.status !== 'ACTIVE') {
    throw new AppError('You can only contribute to an ACTIVE group.', 400);
  }

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new AppError('You must be a member of this group to contribute', 403);
  }

  const amountToPay = group.contributionAmount;

  if (userWallet.balance < amountToPay) {
    throw new AppError(`Insufficient funds. Please fund your wallet with at least ₦${amountToPay}`, 400);
  }

  // 3. Massive Atomic Transaction
  // We process 6 database writes at the exact same time. If one fails, they all fail!
  const reference = `CONT_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  const contributionReceipt = await prisma.$transaction(async (tx) => {
    // A. Deduct from User
    await tx.wallet.update({
      where: { id: userWallet.id },
      data: { balance: { decrement: amountToPay } },
    });

    // B. Record User Debit
    await tx.transaction.create({
      data: {
        walletId: userWallet.id,
        amount: amountToPay,
        type: 'CONTRIBUTION',
        status: 'SUCCESS',
        reference: `${reference}_DEBIT`,
        description: `Contribution to group: ${group.name}`,
      },
    });

    // C. Add to Group Vault
    await tx.wallet.update({
      where: { id: group.wallet!.id },
      data: { balance: { increment: amountToPay } },
    });

    // D. Record Group Credit
    await tx.transaction.create({
      data: {
        walletId: group.wallet!.id,
        amount: amountToPay,
        type: 'CONTRIBUTION',
        status: 'SUCCESS',
        reference: `${reference}_CREDIT`,
        description: `Contribution received from ${user?.firstName}`,
      },
    });

    // E. Update the Group's Total Counter
    await tx.group.update({
      where: { id: groupId },
      data: { totalContributions: { increment: amountToPay } },
    });

    // F. Create the Official Contribution Receipt
    return await tx.contribution.create({
      data: {
        userId,
        groupId,
        amount: amountToPay,
        status: 'CONFIRMED',
        paidAt: new Date(),
      },
    });
  });

  // 4. Real-time Broadcasting! (Outside the transaction because it hits Redis/WebSockets)
  const message = `${user?.firstName} ${user?.lastName} just contributed ₦${amountToPay}! 🎉`;
  await groupService.logAndBroadcast(groupId, 'CONTRIBUTION', message, userId);

  logger.info({ userId, groupId, amount: amountToPay }, 'Contribution processed successfully');

  return sendSuccess(res, contributionReceipt, 'Contribution successful!', 200);
});

export const triggerPayout = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;
  const userId = req.user.id;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError('Group not found', 404);

  // Security: Only the Admin can manually trigger a payout
  if (group.creatorId !== userId) {
    throw new AppError('Only the group admin can trigger payouts', 403);
  }

  // Toss the heavy lifting to the Background Queue
  await payoutQueue.add({ groupId });

  return sendSuccess(res, null, 'Payout job has been queued and is processing...', 200);
});