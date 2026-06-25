import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';

export const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return sendSuccess(res, [], 'Search query required', 200);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: String(q), mode: 'insensitive' } },
        { phone: { contains: String(q) } }
      ]
    },
    //  Never return password hashes or PINs in search results!
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true },
    take: 10,
  });

  return sendSuccess(res, users, 'Users found', 200);
});