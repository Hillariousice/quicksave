import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { timeAgo } from '../../utils/time'; 

export const getActiveSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id as unknown as string;
  const currentUA = req.headers['user-agent'] as string;

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActive: 'desc' }
  });

  const formattedSessions = sessions.map((s: any) => ({
    id: s.id,
    device: s.deviceName,
    location: s.location,
    lastActive: s.userAgent === currentUA ? 'Active now' : timeAgo(s.lastActive),
    current: s.userAgent === currentUA // Identify if this is the device making the request
  }));

  return sendSuccess(res, formattedSessions, 'Sessions retrieved');
});

export const logoutAllDevices = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id as unknown as string;
  const currentUA = req.headers['user-agent'] as string;

  // Delete all sessions EXCEPT the one currently being used
  await prisma.session.deleteMany({
    where: {
      userId,
      NOT: { userAgent: currentUA }
    }
  });

  return sendSuccess(res, null, 'Logged out of all other devices');
});

export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  
  await prisma.session.delete({
    where: { id: sessionId, userId: req.user.id }
  });

  return sendSuccess(res, null, 'Session revoked');
});