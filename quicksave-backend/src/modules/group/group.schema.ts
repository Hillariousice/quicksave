import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Group name must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    contributionAmount: z.number().positive('Contribution amount must be greater than 0'),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('MONTHLY'),
    maxCapacity: z.number().min(2).max(100).default(10),
  }),
});

export const joinGroupSchema = z.object({
  body: z.object({
    inviteCode: z.string().length(8, 'Invite code must be exactly 8 characters'),
  }),
});

// PUT /api/v1/groups/:groupId
export const updateGroupSchema = z.object({
  params: z.object({
    groupId: z.string().uuid('Invalid group ID format'),
  }),
  body: z.object({
    name: z.string().min(3, 'Group name must be at least 3 characters').optional(),
    // We don't allow changing frequency or amount after creation to avoid breaking existing cycles
  }),
});

// POST /api/v1/groups/:groupId/members
export const addMemberSchema = z.object({
  params: z.object({
    groupId: z.string().uuid('Invalid group ID format'),
  }),
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const getGroupSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid group ID format'),
  }),
});

export const generateRotationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid group ID format'),
  }),
  body: z.object({
  mode: z.enum(['RANDOM', 'JOIN_ORDER']).default('RANDOM'),
  startDate: z.string().datetime('Must be a valid ISO date string'),
  }),
});
