import { Request, Response } from 'express';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { sendSuccess } from '../../utils/response';
import { walletService } from '../../services/wallet.service';
import { paystack } from '../../utils/paystack';
import { AppError } from '../../utils/AppError';
import { withdrawalQueue } from '../../queues/withdrawal.queue';
import { quidaxApi } from '../.../../utils/quidax

export const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const wallet = await walletService.getWalletByUserId(userId);
  
  return sendSuccess(res, wallet, 'Wallet retrieved successfully', 200);
});

// export const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user.id;
  
//   // Find the wallet first
//   const wallet = await walletService.getWalletByUserId(userId);

//   // Fetch the ledger history for this wallet
//   const transactions = await prisma.transaction.findMany({
//     where: { walletId: wallet.id },
//     orderBy: { createdAt: 'desc' }, // Newest first
//     take: 50, // Limit to recent 50 for performance
//   });

//   return sendSuccess(res, transactions, 'Transaction history retrieved', 200);
// });

export const fundWallet = catchAsync(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const user = req.user; // Available via requireAuth

  // Generate the Paystack checkout URL
  const paymentData = await paystack.initializeTransaction(user.email, amount, user.id);

  // Send the URL to the React Native app so it can open the Paystack WebView!
  return sendSuccess(res, paymentData, 'Payment initialized', 200);
});


export const withdrawFunds = catchAsync(async (req: Request, res: Response) => {
  const { amount, accountNumber, bankCode, accountName } = req.body;
  const userId = req.user.id;

  // 1. Check balance and lock funds atomically
  const wallet = await walletService.getWalletByUserId(userId);
  
  if (wallet.balance < amount) {
    throw new AppError('Insufficient funds', 400);
  }

  // 2. Deduct the funds IMMEDIATELY as PENDING so they can't double-spend it
  const { transaction } = await prisma.$transaction(async (tx: any) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    });

    const newTx = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        reference: `WD_${Date.now()}_${userId.substring(0, 5)}`,
        description: `Withdrawal to ${accountNumber}`,
      },
    });
    return { transaction: newTx };
  });

  // 3. Throw the heavy lifting to the Background Queue!
  await withdrawalQueue.add({
    transactionId: transaction.id,
    amount,
    accountNumber,
    bankCode,
    accountName,
    userId,
  });

  return sendSuccess(res, transaction, 'Withdrawal is being processed', 200);
});


export const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { type, page = 1, limit = 20 } = req.query;

  const wallet = await walletService.getWalletByUserId(userId);

  const where: any = { walletId: wallet.id };
  if (type && type !== 'All') {
    where.type = type;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  return sendSuccess(res, transactions, 'Transaction history retrieved', 200);
});


export const getTransactionDetails = catchAsync(async (req: Request, res: Response) => {
  const  id  = req.params.id as unknown as string;
  const userId = req.user.id;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      wallet: {
        select: { userId: true }
      }
    }
  });

  if (!transaction || transaction.wallet!.userId !== userId) {
    throw new AppError('Transaction not found', 404);
  }

  return sendSuccess(res, transaction, 'Transaction details retrieved', 200);
});


export const getCryptoAddress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  let wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) throw new AppError('Wallet not found', 404);

  if (!wallet.usdtAddress) {
    // Generate a new one via Quidax
    const newAddress = await quidaxApi.generateDepositAddress(userId);
    wallet = await prisma.wallet.update({
      where: { userId },
      data: { usdtAddress: newAddress }
    });
  }

  return sendSuccess(res, { address: wallet.usdtAddress, network: 'TRC-20' }, 'Address retrieved', 200);
});

// 👉 Instant NGN to USDT Swap
export const swapCurrency = catchAsync(async (req: Request, res: Response) => {
  const { amountNGN } = req.body;
  const userId = req.user.id;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || wallet.balanceNGN < amountNGN) {
    throw new AppError('Insufficient NGN balance', 400);
  }

  const exchangeRate = await quidaxApi.getExchangeRate();
  const amountUSDT = amountNGN / exchangeRate; // e.g., 160,000 / 1600 = 100 USDT

  // Atomic Swap Transaction!
  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceNGN: { decrement: amountNGN },
        balanceUSDT: { increment: amountUSDT }
      }
    });

    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amountUSDT,
        type: 'SWAP',
        status: 'SUCCESS',
        reference: `SWAP_${Date.now()}`,
        description: `Swapped ₦${amountNGN} for ₮${amountUSDT.toFixed(2)}`
      }
    });

    return updatedWallet;
  });

  return sendSuccess(res, { balanceNGN: result.balanceNGN, balanceUSDT: result.balanceUSDT }, 'Swap successful', 200);
});