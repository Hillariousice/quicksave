import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database'; // or config/prisma
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Financial Engine: Wallets & Contributions', () => {
  let userToken: string;
  let userId: string;
  let groupId: string;
  let userWalletId: string;
  let groupWalletId: string;

  beforeAll(async () => {
    // 1. Scaffold User
    const user = await prisma.user.create({
      data: {
        email: 'finance.test@ajo.com',
        phone: '08044445555',
        firstName: 'Finance',
        lastName: 'Tester',
        passwordHash: 'hash',
        isVerified: true,
        wallet: { create: { balance: 0 } } // Start with 0 balance!
      },
      include: { wallet: true }
    });
    
    userId = user.id;
    userWalletId = user.wallet!.id;
    userToken = jwt.sign({ id: user.id }, env.JWT_SECRET);

    // 2. Scaffold an ACTIVE Group with a Vault
    const group = await prisma.group.create({
      data: {
        name: 'Financial Test Group',
        contributionAmount: 50000,
        frequency: 'MONTHLY',
        maxCapacity: 5,
        status: 'ACTIVE', // Must be active to accept contributions
        inviteCode: 'FIN12345',
        creatorId: user.id,
        members: {
          create: { userId: user.id, role: 'ADMIN', status: 'ACTIVE' }
        },
        wallet: { create: { balance: 0 } } // Group vault starts at 0
      },
      include: { wallet: true }
    });

    groupId = group.id;
    groupWalletId = group.wallet!.id;
  });

  describe('1. Wallet Safety & Overdraft Protection', () => {
    it('should fetch the wallet and confirm a 0 balance', async () => {
      const res = await request(app)
        .get('/api/v1/wallets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balance).toBe(0);
    });

    it('should block a contribution if the wallet has insufficient funds', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/contributions`)
        .set('Authorization', `Bearer ${userToken}`);

      // Our Day 24 / Day 70 logic should block this!
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient funds');
    });
  });

  describe('2. Wallet Funding & Atomic Contributions', () => {
    it('should securely fund the wallet (Simulating Paystack Webhook)', async () => {
      // Because testing the actual webhook requires hashing a fake Paystack signature,
      // we will simulate the successful funding directly via Prisma for the test environment.
      await prisma.wallet.update({
        where: { id: userWalletId },
        data: { balance: { increment: 100000 } } // Fund with 100k
      });

      // Verify via API
      const res = await request(app)
        .get('/api/v1/wallets')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body.data.balance).toBe(100000);
    });

    it('should successfully process an atomic contribution', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/contributions`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(50000);
      expect(res.body.data.status).toBe('CONFIRMED');

      // ⭐️ The ultimate financial audit: Check the database balances!
      const finalUserWallet = await prisma.wallet.findUnique({ where: { id: userWalletId } });
      const finalGroupVault = await prisma.wallet.findUnique({ where: { id: groupWalletId } });

      // User started with 100k, contributed 50k. Should have 50k left.
      expect(finalUserWallet?.balance).toBe(50000);
      // Group started with 0, received 50k. Should have 50k total.
      expect(finalGroupVault?.balance).toBe(50000);
    });
  });

  describe('3. Transaction Ledger Integrity', () => {
    it('should have created double-entry ledger records for the contribution', async () => {
      // Fetch user's transaction history
      const res = await request(app)
        .get('/api/v1/wallets/transactions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const transactions = res.body.data;

      // Ensure the debit transaction was recorded perfectly
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].type).toBe('CONTRIBUTION');
      expect(transactions[0].amount).toBe(50000);
      expect(transactions[0].status).toBe('SUCCESS');
      expect(transactions[0].reference).toContain('DEBIT');

      // Check the group's ledger to ensure the matching CREDIT exists
      const groupTx = await prisma.transaction.findFirst({
        where: { walletId: groupWalletId, type: 'CONTRIBUTION' }
      });

      expect(groupTx).not.toBeNull();
      expect(groupTx?.amount).toBe(50000);
      expect(groupTx?.reference).toContain('CREDIT');
    });
  });
});