import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';

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

// export const updateProfile = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
//   const { firstName, lastName, phone } = req.body; // Add bio if you update Prisma schema

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: { firstName, lastName, phone },
//   });

//   const { passwordHash: _, pin: __, ...safeUser } = updatedUser;
//   return sendSuccess(res, safeUser, 'Profile updated successfully', 200);
// });

//  Verify the bank account with Paystack before saving it!
export const addBankAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { bankName, bankCode, accountNumber } = req.body;

  // 1. Ask Paystack if this is a real bank account
  const paystackRes = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` }
  });
  
  const data = await paystackRes.json() as any;

  if (!data.status) {
    throw new AppError('Invalid bank account details', 400);
  }

  // 2. Save it securely to Prisma
  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId,
      bankName,
      bankCode,
      accountNumber,
      accountName: data.data.account_name, // The real name confirmed by the bank!
    }
  });

  return sendSuccess(res, bankAccount, 'Bank account added successfully', 201);
});

export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  const [totalSaved, totalReceived, groupCount] = await Promise.all([
    prisma.contribution.aggregate({
      where: { userId, status: 'CONFIRMED' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { wallet: { userId }, type: 'PAYOUT', status: 'SUCCESS' },
      _sum: { amount: true }
    }),
    prisma.groupMember.count({
      where: { userId, status: 'ACTIVE' }
    })
  ]);

  return sendSuccess(res, {
    totalSaved: totalSaved._sum.amount || 0,
    totalReceived: totalReceived._sum.amount || 0,
    groupCount
  }, 'Stats retrieved');
});

// GET All Bank Accounts
export const getBankAccounts = catchAsync(async (req: Request, res: Response) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: req.user.id }
  });
  return sendSuccess(res, accounts, 'Banks retrieved');
});

// Update Profile Fix: Also allow updating bio if exists
export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { firstName, lastName, phone, bio } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, phone } // Note: Add bio to Prisma schema if needed
  });

  return sendSuccess(res, updatedUser, 'Profile updated');
});