import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { authService } from '../../services/auth.service';

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
  const { firstName, lastName, phone, bio, avatar } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, phone, bio, avatar } // Note: Add bio to Prisma schema if needed
  });

  return sendSuccess(res, updatedUser, 'Profile updated');
});

export const updatePushToken = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { pushToken } = req.body;

  await prisma.user.update({
    where: { id: userId },
    data: { pushToken }
  });

  return sendSuccess(res, null, 'Push token synced', 200);
});


export const getAvailableBanks = catchAsync(async (req: Request, res: Response) => {
  // Paystack's public API to get all Nigerian banks
  const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` }
  });
  
  const data = await response.json() as any;
  
  if (!data.status) {
    throw new AppError('Failed to fetch bank list', 500);
  }

  // Return the list of banks (contains name and code)
  return sendSuccess(res, data.data, 'Banks retrieved successfully');
});


export const verifyUserBvn = catchAsync(async (req: Request, res: Response) => {
  const { bvn } = req.body;
  const userId = req.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (user.kycTier !== 'TIER_0') {
    throw new AppError('User is already verified', 400);
  }

  // 1. Call Smile ID to verify the BVN against the name they registered with
  const isValid = await smileIdApi.verifyBVN(bvn, user.firstName, user.lastName);

  if (!isValid) {
    throw new AppError('Verification failed. The name on the BVN does not match your profile.', 400);
  }

  // 2. Upgrade the User to TIER_1!
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { 
      bvn: bvn, // In production, consider encrypting this before saving!
      kycTier: 'TIER_1' 
    }
  });

  const { passwordHash: _, pin: __, refreshToken: ___, ...safeUser } = updatedUser as any;
  return sendSuccess(res, safeUser, 'Identity verified successfully!', 200);
});


export const verifyKycWithPaystack = catchAsync(async (req: Request, res: Response) => {
  const { accountNumber, bankCode } = req.body;
  const userId = req.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  if (user.kycTier !== 'TIER_0') {
    throw new AppError('You are already verified.', 400);
  }

  // 1. Call Paystack Account Resolution API
  const paystackRes = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
    }
  );

  const data = await paystackRes.json();

  if (!data.status) {
    throw new AppError('Could not verify this bank account. Please check the details.', 400);
  }

  const bankAccountName = data.data.account_name.toLowerCase();
  const firstName = user.firstName.toLowerCase();
  const lastName = user.lastName.toLowerCase();

  // 2. Fuzzy Name Matching
  // Bank names are often formatted like "OKPORKA HILLARY CHUKWU". 
  // We check if both the user's first AND last name exist inside the bank account name.
  if (!bankAccountName.includes(firstName) || !bankAccountName.includes(lastName)) {
    throw new AppError(`Verification failed. The bank account name (${data.data.account_name}) does not match your Quicksave profile name (${user.firstName} ${user.lastName}).`, 403);
  }

  // 3. Match successful! Save the bank account and upgrade to TIER_1
  await prisma.$transaction(async (tx: any) => {
    // Save it so they can use it for withdrawals later
    await tx.bankAccount.create({
      data: {
        userId,
        bankName: "Verified Bank", // In production, map bankCode to actual bank name
        bankCode,
        accountNumber,
        accountName: data.data.account_name,
        isDefault: true,
      }
    });

    // Upgrade their KYC Tier
    await tx.user.update({
      where: { id: userId },
      data: { kycTier: 'TIER_1' }
    });
  });

  // Fetch fresh user data to return
  const updatedUser = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, kycTier: true }
  });

  return sendSuccess(res, updatedUser, 'Identity verified successfully!', 200);
});
