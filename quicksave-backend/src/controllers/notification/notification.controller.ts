import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return sendSuccess(res, notifications, 'Notifications retrieved');
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.notification.update({
    where: { id, userId: req.user.id },
    data: { isRead: true }
  });
  return sendSuccess(res, null, 'Marked as read');
});