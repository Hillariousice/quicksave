import Queue from 'bull';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { paystack } from '../utils/paystack';
import prisma from '../config/database';
import { getIo } from '../config/socket';

// Initialize the queue using your Redis URL
export const withdrawalQueue = new Queue('wallet-withdrawals', env.REDIS_URL, {
  redis: { maxRetriesPerRequest: null }
});

// The Background Worker Processor
withdrawalQueue.process(async (job) => {
  const { transactionId, amount, accountNumber, bankCode, accountName, userId } = job.data;

  try {
    // 1. Create recipient on Paystack
    const recipientCode = await paystack.createTransferRecipient(accountName, accountNumber, bankCode);

    // 2. Initiate Transfer
    const transfer = await paystack.initiateTransfer(amount, recipientCode, transactionId, 'QuickSave Wallet Withdrawal');

    // Paystack will process this. The final SUCCESS or FAILED will actually be handled 
    // by your webhook when Paystack sends the "transfer.success" event!
    logger.info({ transactionId }, 'Withdrawal pushed to Paystack successfully');
    
  } catch (error: any) {
    logger.error({ err: error, transactionId }, 'Withdrawal job failed');

    // If it immediately fails (e.g., bad bank account), refund the user's wallet!
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED', description: `Withdrawal failed: ${error.message}` },
      }),
      prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } }, // Refund the money!
      }),
    ]);

    // Alert the user via WebSockets!
    getIo().to(userId).emit('withdrawalFailed', { message: 'Your withdrawal failed. Funds refunded.' });
  }
});