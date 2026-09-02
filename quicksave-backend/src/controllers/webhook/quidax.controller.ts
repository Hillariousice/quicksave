import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import prisma from '../../config/database';

export const quidaxWebhook = async (req: Request, res: Response) => {
  // 1. 🚨 SECURITY: Verify the Quidax Signature!
  const hash = crypto
    .createHmac('sha256', env.QUIDAX_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['quidax-signature']) {
    logger.warn('🚨 Unauthorized Quidax webhook attempt: Invalid Signature');
    return res.status(400).send('Invalid signature');
  }

  // 2. Acknowledge Receipt immediately
  res.sendStatus(200);

  const event = req.body;

  try {
    // Quidax sends 'deposit.successful' when crypto is confirmed on the blockchain
    if (event.event === 'deposit.successful') {
      const { amount, currency, txid, payment_address } = event.data as any;

      // 3. Ensure it is USDT
      if (currency !== 'usdt') return;

      // 4. Find which user owns this deposit address
      const wallet = await prisma.wallet.findUnique({ 
        where: { usdtAddress: payment_address } 
      });

      if (!wallet) {
        logger.error({ address: payment_address }, 'Received crypto for unknown wallet address');
        return;
      }

      // 5. Check Idempotency (Did we already credit this txid?)
      const existingTx = await prisma.transaction.findUnique({ where: { reference: txid } });
      if (existingTx) return;

      // 6. Credit the user's USDT Wallet (Update your walletService to handle USDT dynamically)
      await prisma.$transaction(async (tx: any) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceUSDT: { increment: Number(amount) } }
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: Number(amount),
            type: 'FUNDING',
            status: 'SUCCESS',
            reference: txid, // The blockchain transaction hash
            description: `Crypto Deposit via Quidax`,
          }
        });
      });

      logger.info({ userId: wallet.userId, amount }, '💰 USDT Wallet funded successfully via Quidax');
      
      // 👉 Don't forget to trigger a Socket.io event here to update their Mobile UI instantly!
    }
  } catch (error) {
    logger.error({ err: error }, 'Error processing Quidax webhook');
  }
};