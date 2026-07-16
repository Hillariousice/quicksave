import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';
import app from '../../app';
import prisma from '../../config/database';
import { env } from '../../config/env';

describe('Paystack Webhook Security & Idempotency', () => {
  let userWalletId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: 'webhook@ajo.com', phone: '080WH', firstName: 'Web', lastName: 'Hook', passwordHash: 'hash', wallet: { create: { balance: 0 } } },
      include: { wallet: true }
    });
    userWalletId = user.wallet!.userId!;
  });

  it('1. should reject requests with an invalid HMAC signature', async () => {
    const payload = { event: 'charge.success', data: { reference: 'tx_123', amount: 500000 } };

    const res = await request(app)
      .post('/api/v1/webhooks/paystack')
      .set('x-paystack-signature', 'fake_hacker_signature')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toBe('Invalid signature');
  });

  it('2. should process a valid signature and fund the wallet', async () => {
    const payload = { event: 'charge.success', data: { reference: 'tx_valid_1', amount: 500000, metadata: { userId: userWalletId } } };
    
    // Generate the correct mathematical signature
    const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(JSON.stringify(payload)).digest('hex');

    const res = await request(app)
      .post('/api/v1/webhooks/paystack')
      .set('x-paystack-signature', hash)
      .send(payload);

    expect(res.status).toBe(200);

    // Verify DB update (500000 Kobo = 5000 Naira)
    const wallet = await prisma.wallet.findUnique({ where: { userId: userWalletId } });
    expect(wallet?.balance).toBe(5000);
  });

  it('3. should skip duplicate transactions (Idempotency)', async () => {
    const payload = { event: 'charge.success', data: { reference: 'tx_valid_1', amount: 500000, metadata: { userId: userWalletId } } };
    const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(JSON.stringify(payload)).digest('hex');

    // Fire the exact same request again
    const res = await request(app)
      .post('/api/v1/webhooks/paystack')
      .set('x-paystack-signature', hash)
      .send(payload);

    expect(res.status).toBe(200);

    // Wallet balance should STILL be 5000, not 10000!
    const wallet = await prisma.wallet.findUnique({ where: { userId: userWalletId } });
    expect(wallet?.balance).toBe(5000);
  });
});