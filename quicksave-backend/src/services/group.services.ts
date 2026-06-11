import prisma from "../config/database";
import { getIo } from "../config/socket";

export const groupService = {
    async updateGroupDetails(groupId: string, data: any) {
        return await prisma.group.update({
            where: { id: groupId },
            data,
        });
    },
    
    async getGroupDetails(groupId: string) {
        return await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: true,
                wallet: true,
            },
        });
    },

    async getGroupMembers(groupId: string) {
        return await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: true,
            },
        });
    },

     async logAndBroadcast(groupId: string, action: string, message: string, userId?: string) {
    // Save to PostgreSQL Audit Trail
    
    const log = await prisma.activityLog.create({
      data: { groupId, action, message, userId },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
      },
    });

    // Broadcast to everyone currently looking at this group!
    getIo().to(groupId).emit('newActivity', log);

    return log;
  },

   async getRotationTimeline(groupId: string) {
    // 1. Fetch all slots in order, including user details
    const slots = await prisma.rotationSlot.findMany({
      where: { groupId },
      orderBy: { position: 'asc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    // 2. Calculate the current active turn 
    // (The first person in the line whose status is NOT 'PAID')
    const currentTurn = slots.find((slot) => slot.status !== 'PAID') || null;

    // 3. Calculate group progress
    const totalCycles = slots.length;
    const completedCycles = slots.filter((slot) => slot.status === 'PAID').length;
    const progressPercentage = totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0;

    // 4. Return a perfectly structured object for the React Native app
    return {
      currentTurn,
      progress: {
        totalCycles,
        completedCycles,
        percentage: Math.round(progressPercentage),
      },
      timeline: slots,
    };
  },
};