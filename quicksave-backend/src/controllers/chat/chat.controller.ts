import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { getIo } from '../../config/socket';

export const getChatList = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  // Fetch groups user belongs to + the last message in each
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } }
    }
  });

  const chatList = groups.map(g => ({
    id: g.id,
    name: g.name,
    text: g.messages[0]?.content || "No messages yet",
    time: g.messages[0]?.createdAt || g.createdAt,
    unread: 0, // Logic for unread can be added later
    isGroup: true
  }));

  return sendSuccess(res, chatList, 'Chat list retrieved');
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const messages = await prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { firstName: true, avatar: true } } }
  });
  return sendSuccess(res, messages, 'Messages retrieved');
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { groupId, content, type } = req.body;
  const senderId = req.user.id;

  const message = await prisma.message.create({
    data: { content, type: type || 'TEXT', senderId, groupId },
    include: { sender: { select: { firstName: true, avatar: true } } }
  });

  // Emit to Socket.io room
  getIo().to(groupId).emit('new_message', message);

  return sendSuccess(res, message, 'Message sent', 201);
});