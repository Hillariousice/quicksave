import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../config/logger';
import crypto from 'crypto';
import redis from '../../config/redis';
import { AppError } from '../../utils/AppError';

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

  // 3. ENFORCE CAPACITY: Check if the group is full
  if (group.members.length >= group.maxCapacity) {
    throw new AppError('This group has reached its maximum capacity.', 403);
  }

  // 4. PREVENT DUPLICATES: Check if user is already a member
  const isAlreadyMember = group.members.some((member) => member.userId === userId);
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

  logger.info({ groupId, userId }, 'User joined group via invite code');
  return sendSuccess(res, newMember, `You have successfully joined ${group.name}!`, 200);
});


export const getGroupDetails = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.id;
  const userId = req.user.id;

  // 1. Fetch the enriched group data
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      wallet: true, // Get the total group balance
      contributions: {
        orderBy: { createdAt: 'desc' },
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

  // 2. 🚨 SECURITY CHECK: Ensure the requesting user is actually a member of this group
  const isMember = group.members.some((member) => member.userId === userId);
  if (!isMember) {
    throw new AppError('You are not authorized to view this group', 403);
  }

  // 3. Send the enriched data
  return sendSuccess(res, group, 'Group details retrieved successfully', 200);
});


export const updateGroupDetails = catchAsync(async (req: Request, res: Response) => {
  const groupId = req.params.groupId;
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
  const groupId = req.params.groupId;

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
  const groupId = req.params.id;
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
  const groupId = req.params.id;

  const slots = await prisma.rotationSlot.findMany({
    where: { groupId },
    orderBy: { position: 'asc' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  return sendSuccess(res, slots, 'Rotation schedule retrieved', 200);
});