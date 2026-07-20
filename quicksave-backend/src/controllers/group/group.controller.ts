import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../config/logger';
import crypto from 'crypto';
import redis from '../../config/redis';
import { AppError } from '../../utils/AppError';
import { groupService } from '../../services/group.service';
import { getIo } from '../../config/socket';
import { payoutQueue } from '../../queues/payout.queue';
import { syncQueue } from '../../queues/sync.queue';

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
  const inviteCode = req.body.inviteCode.toUpperCase();
  const userId = req.user.id;

   const redisStart = performance.now();
  // 1. FAST LOOKUP: Check Redis for the Group ID
  let groupId = await redis.get(`invite:${inviteCode}`);
   const redisEnd = performance.now();

  if (!groupId) {
    const group = await prisma.group.findUnique({ where: { inviteCode } });
    if (!group) throw new AppError('Invalid invite code. Group not found.', 404);
    groupId = group.id;
    await redis.setex(`invite:${inviteCode}`, 2592000, groupId);
  }

  // Move fetch, capacity check, and create INSIDE a locked transaction!
  const { newMember, group, joiningUser } = await prisma.$transaction(async (tx) => {
    
    // 1. LOCK THE GROUP ROW: Concurrent join requests will pause right here and wait their turn.
    await tx.$executeRaw`SELECT * FROM "Group" WHERE id = ${groupId} FOR UPDATE`;

    // 2. Safely fetch the group with its current members
    const safeGroup = await tx.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });

    if (!safeGroup) throw new AppError('Group not found.', 404);

    const currentMembers = (safeGroup as any).members || [];
    
    // 3. ENFORCE CAPACITY (100% accurate now)
    if (currentMembers.length >= safeGroup.maxCapacity) {
      throw new AppError('This group has reached its maximum capacity.', 403);
    }

    // 4. PREVENT DUPLICATES
    const isAlreadyMember = currentMembers.some((member: any) => member.userId === userId);
    if (isAlreadyMember) {
      throw new AppError('You are already a member of this group.', 409);
    }

    // 5. Success! Add them to the group
    const member = await tx.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date(),
      },
    });

    // Fetch user for broadcast
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, avatar: true }
    });

    // Return the data out of the transaction block
    return { newMember: member, group: safeGroup, joiningUser: user };
  }); // 🔓 The lock is automatically released here!

  const members = await prisma.groupMember.findMany({ where: { groupId } });
  await prisma.notification.createMany({
  data: members.map((m: any)=> ({
    userId: m.userId,
    type: 'GROUP_UPDATE',
    title: 'New Member Joined',
    message: `${req.user.firstName} joined ${group.name}`,
    metadata: { groupId, userName: req.user.firstName }
  }))
});
  // 6. Broadcast Real-Time Events (Outside the transaction)
  const io = getIo();
  io.to(groupId).emit('member:joined', {
    groupId,
    groupName: group.name,
    member: {
      id: userId,
      firstName: joiningUser?.firstName,
      lastName: joiningUser?.lastName,
      avatar: joiningUser?.avatar
    }
  });

  await groupService.logAndBroadcast(groupId, 'JOINED', `${joiningUser?.firstName} joined the group!`, userId);

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
      position: index + 1, 
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
  const timelineData = await prisma.rotationSlot.findMany({
    where: { groupId },
    include: { user: { select: { firstName: true, avatar: true } } },
    orderBy: { position: 'asc' }
  })

  return sendSuccess(res, timelineData || [],  'Rotation timeline retrieved successfully', 200);
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

//  UPDATE GROUP LIFECYCLE STATUS ---
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

  // 1. Fetch Group data (No need to lock the group just to read the amount)
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, wallet: true },
  });

  if (!group || !group.wallet) throw new AppError('Group or Group Vault not found', 404);

  if (group.status !== 'ACTIVE') {
    throw new AppError('You can only contribute to an ACTIVE group.', 400);
  }

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) {
    throw new AppError('You must be a member of this group to contribute', 403);
  }

  const amountToPay = group.contributionAmount;
  const reference = `CONT_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  // Lock the Wallet BEFORE checking the balance inside the transaction
  const { contributionReceipt, user } = await prisma.$transaction(async (tx) => {
    
    // A. Find the Wallet ID
    const userWalletBase = await tx.wallet.findUnique({ where: { userId } });
    if (!userWalletBase) throw new AppError('User wallet not found', 404);

    // B. LOCK THE USER'S WALLET ROW (Double-taps stop here!)
    await tx.$executeRaw`SELECT * FROM "Wallet" WHERE id = ${userWalletBase.id} FOR UPDATE`;

    // C. Re-read the wallet to get the absolutely latest, locked balance
    const safeWallet = await tx.wallet.findUnique({ where: { id: userWalletBase.id } });

    // D. Safe Balance Check
    if (safeWallet!.balance < amountToPay) {
      throw new AppError(`Insufficient funds. Please fund your wallet with at least ₦${amountToPay}`, 400);
    }

    // E. Deduct from User
    await tx.wallet.update({
      where: { id: safeWallet!.id },
      data: { balance: { decrement: amountToPay } },
    });

    // F. Record User Debit
    await tx.transaction.create({
      data: {
        walletId: safeWallet!.id,
        amount: amountToPay,
        type: 'CONTRIBUTION',
        status: 'SUCCESS',
        reference: `${reference}_DEBIT`,
        description: `Contribution to group: ${group.name}`,
      },
    });

    // G. Add to Group Vault
    await tx.wallet.update({
      where: { id: group.wallet!.id },
      data: { balance: { increment: amountToPay } },
    });

    const txUser = await tx.user.findUnique({ where: { id: userId }});

    // H. Record Group Credit
    await tx.transaction.create({
      data: {
        walletId: group.wallet!.id,
        amount: amountToPay,
        type: 'CONTRIBUTION',
        status: 'SUCCESS',
        reference: `${reference}_CREDIT`,
        description: `Contribution received from ${txUser?.firstName}`,
      },
    });

    // I. Update the Group's Total Counter
    await tx.group.update({
      where: { id: groupId },
      data: { totalContributions: { increment: amountToPay } },
    });

    // J. Create the Official Contribution Receipt
    const receipt = await tx.contribution.create({
      data: {
        userId,
        groupId,
        amount: amountToPay,
        status: 'CONFIRMED',
        paidAt: new Date(),
      },
    });

    return { contributionReceipt: receipt, user: txUser };
  }); // 🔓 Lock is released here!

   await prisma.notification.create({
  data: {
    userId,
    type: 'CONTRIBUTION_CONFIRMED',
    title: 'Contribution Successful',
    message: `Your contribution of ₦${amountToPay.toLocaleString()} was successful.`,
    metadata: { amount: amountToPay, groupId: group.id, groupName: group.name }
  }
});
  // 4. Real-time Broadcasting!
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

export const inviteMembers = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id as string;
  const { userIds } = req.body; // Array of selected user IDs
  const adminId = req.user.id;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) throw new AppError('Group not found', 404);
  if (group.creatorId !== adminId) throw new AppError('Only the admin can invite members', 403);

  // 1. Capacity Check
  if (group.members.length + userIds.length > group.maxCapacity) {
    throw new AppError(`Cannot invite. Group only has ${group.maxCapacity - group.members.length} slots left.`, 400);
  }

  // 2. Filter out users who are already in the group (or already invited)
  const existingUserIds = group.members.map((m: any) => m.userId);
  const newIdsToInvite = userIds.filter((id: string) => !existingUserIds.includes(id));

  if (newIdsToInvite.length === 0) {
    return sendSuccess(res, null, 'All selected users are already invited or in the group.', 200);
  }

  // 3. Atomic Transaction: Create PENDING members and Notifications
  await prisma.$transaction(async (tx: any) => {
    // A. Create the PENDING group members
    await tx.groupMember.createMany({
      data: newIdsToInvite.map((id: string) => ({
        groupId,
        userId: id,
        role: 'MEMBER',
        status: 'PENDING', // PENDING means it's an invite!
      })),
    });

    // B. Create Notifications for each user
    await tx.notification.createMany({
      data: newIdsToInvite.map((id: string) => ({
        userId: id,
        type: 'GROUP_INVITE',
        title: 'Group Invitation',
        message: `You have been invited to join ${group.name}`,
        metadata: { groupId },
      })),
    });
  });

  // 4. Real-Time Socket Event
  // (Assuming your mobile app tells users to join a socket room matching their User ID on login)
  const io = getIo();
  newIdsToInvite.forEach((id: string) => {
    io.to(id).emit('newNotification', { title: 'New Invite', message: `You were invited to ${group.name}` });
  });

  return sendSuccess(res, null, `Successfully invited ${newIdsToInvite.length} members!`, 200);
});


export const getMyGroups = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  // 1. Fetch all groups where this user is a member
  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: { userId: userId }, // "Find groups where SOME member has my userId"
      },
    },
    include: {
      // We only need basic member info to show the overlapping avatars on the mobile app
      members: {
        take: 3, // Just take 3 members for the UI avatars
        include: {
          user: { select: { id: true, avatar: true, firstName: true } },
        },
      },
      _count: {
        select: { members: true }, // Get the total member count efficiently
      },
    },
    orderBy: { createdAt: 'desc' }, // Newest groups first
  });

  // 2. Enrich the data for the frontend (Calculate the progress percentage!)
  const enrichedGroups = groups.map((group: any) => {
    // Progress = (current members / max capacity) * 100
    const progressRaw = (group._count.members / group.maxCapacity) * 100;
    const progress = Math.min(Math.round(progressRaw), 100); // Cap at 100%

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      contributionAmount: group.contributionAmount,
      frequency: group.frequency,
      status: group.status,
      maxCapacity: group.maxCapacity,
      membersCount: group._count.members,
      progress: progress,
      nextPayoutDate: group.nextPayoutDate || group.startDate,
      // Pass the 3 avatars for the UI
      avatars: group.members.map((m: any) => m.user.avatar || 'https://i.pravatar.cc/150?img=11') 
    };
  });

  return sendSuccess(res, enrichedGroups, 'Groups retrieved successfully', 200);
});

export const syncOfflineContributions = catchAsync(async (req: Request, res: Response) => {
  const { contributions } = req.body; // Array of items from Mobile SQLite
  const userId = req.user.id;

  if (!Array.isArray(contributions) || contributions.length === 0) {
    return sendSuccess(res, null, 'No contributions to sync', 200);
  }

  // Toss them all into the Bull Queue for safe, background processing
  const jobs = contributions.map((c: any) => ({
    name: 'process-sync',
    data: { userId, groupId: c.groupId, amount: c.amount, offlineId: c.id } // c.id is the SQLite UUID
  }));

  // Add in bulk
  await syncQueue.addBulk(jobs);

  return sendSuccess(res, null, 'Offline contributions queued for syncing', 202);
});