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
  }
};