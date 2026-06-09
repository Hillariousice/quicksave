import prisma from "../config/database";

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
    }
};