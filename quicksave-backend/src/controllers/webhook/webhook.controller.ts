import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../config/database'; // or '../../config/prisma'

import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { walletService } from '../../services/wallet.services';

export const paystackWebhook = async (req: Request, res: Response) => {
  // 1. 🚨 SECURITY: Verify the Paystack Signature
  // Paystack signs the payload using your Secret Key. We hash the incoming body and compare it.
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY) // Paystack signs with your secret key
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    logger.warn('🚨 Unauthorized webhook attempt: Invalid Signature');
    return res.status(400).send('Invalid signature');
  }

  // 2. Acknowledge Receipt IMMEDIATELY
  // Paystack requires a 200 OK within seconds, or they will assume it failed and retry later.
  res.sendStatus(200);

  const event = req.body;

  // 3. Process the Event Asynchronously
  try {
    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      
      // We expect the frontend to pass the userId inside the Paystack metadata when initializing
      const userId = metadata?.userId; 

      if (!userId) {
        logger.error({ reference }, 'Webhook payload missing userId in metadata');
        return;
      }

      // 4. Idempotency Check (Prevent Double Funding)
      // Check if we already processed this exact payment reference
      const existingTx = await prisma.transaction.findUnique({ where: { reference } });
      if (existingTx) {
        logger.info({ reference }, 'Transaction already processed. Skipping.');
        return;
      }

      // 5. Fetch the user's wallet
      const wallet = await walletService.getWalletByUserId(userId);

      // 6. ⭐️ Convert Kobo to Naira
      // Paystack sends amounts in the lowest currency unit (Kobo). ₦50,000 comes as 5000000.
      const amountInNaira = amount / 100;

      // 7. Safely Credit the Wallet (This uses our Day 22 atomic transaction!)
      await walletService.creditWallet(
        wallet.id,
        amountInNaira,
        reference,
        'Wallet Funding via Paystack',
        'CONTRIBUTION' 
      );

      logger.info({ userId, amount: amountInNaira, reference }, '💰 Wallet funded successfully via Paystack Webhook');
    }
  } catch (error) {
    logger.error({ err: error, event }, 'Error processing Paystack webhook');
  }
};