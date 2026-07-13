
import { TransactionType } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { getIo } from "../config/socket";

export const walletService = {
  // 1. Fetch wallet with safe balance
  async getWalletByUserId(userId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not found', 404);
    return wallet;
  },

  // 2. Atomic Credit Transaction
  async creditWallet(walletId: string, amount: number, reference: string, description: string, type: TransactionType) {
    // We use a Prisma $transaction so if the ledger fails to write, the balance is NOT updated!
    return await prisma.$transaction(async (tx) => {
      // 1. Safely add money using "increment" (Prevents race conditions!)
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });


      // 2. Write the ledger record
      const transaction = await tx.transaction.create({
        data: {
          walletId,
          amount,
          type,
          status: 'SUCCESS', // Automatically successful for internal credits
          reference,
          description,
        },
      });

      getIo().to(`user_${result.wallet.userId}`).emit('walletUpdated');
      return { wallet: updatedWallet, transaction };
    });
  },

  // 3. Atomic Debit Transaction
  async debitWallet(walletId: string, amount: number, reference: string, description: string, type: TransactionType) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if they have enough money FIRST
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet || wallet.balance < amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      // 2. Safely deduct money using "decrement"
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });

      // 3. Write the ledger record
      const transaction = await tx.transaction.create({
        data: {
          walletId,
          amount,
          type,
          status: 'SUCCESS',
          reference,
          description,
        },
      });

      getIo().to(`user_${result.wallet.userId}`).emit('walletUpdated');
      return { wallet: updatedWallet, transaction };
    });
  }
};