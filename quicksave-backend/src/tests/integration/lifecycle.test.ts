import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database'; 
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import { payoutService } from '../../modules/group/payout.service';

describe('App Lifecycle & Middleware Seams', () => {
  let adminToken: string;
  let memberToken: string;
  let adminId: string;
  let memberId: string;
  let groupId: string;
  let inviteCode: string;

  beforeAll(async () => {
    // Scaffold 2 Users
    const admin = await prisma.user.create({
      data: { email: 'admin.life@ajo.com', phone: '0809911', firstName: 'Admin', lastName: 'A', passwordHash: 'hash', isVerified: true, wallet: { create: { balance: 0 } } }
    });
    const member = await prisma.user.create({
      data: { email: 'member.life@ajo.com', phone: '0809922', firstName: 'Member', lastName: 'B', passwordHash: 'hash', isVerified: true, wallet: { create: { balance: 100000 } } } // Pre-funded!
    });

    adminId = admin.id;
    memberId = member.id;
    adminToken = jwt.sign({ id: admin.id }, env.JWT_SECRET);
    memberToken = jwt.sign({ id: member.id }, env.JWT_SECRET);
  });

  describe('1. Middleware Seams (Validation & Auth Guards)', () => {
    it('should catch malformed data using Zod Middleware and return 400', async () => {
      // 🚨 Simulating a frontend bug where the React Native app sends bad data
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'St', // Too short! (Zod expects min 3)
          contributionAmount: "50000", // Wrong type! (Zod expects number, not string)
          frequency: 'YEARLY' // Invalid enum!
        });

      // The Global Error Handler should format this beautifully
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      
      // Verify Zod caught all the specific errors
      const errorFields = res.body.errors.map((e: any) => e.field);
      expect(errorFields).toContain('body.name');
      expect(errorFields).toContain('body.contributionAmount');
      expect(errorFields).toContain('body.frequency');
    });

    it('should catch invalid JWT tokens using Auth Middleware and return 401', async () => {
      const res = await request(app)
        .get('/api/v1/wallets')
        .set('Authorization', `Bearer fake_hacker_token_123`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid token');
    });
  });

  describe('2. The Golden Ajo Lifecycle', () => {
    it('Step A: Admin successfully creates a group', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Golden Lifecycle Group', contributionAmount: 50000, maxCapacity: 2 });

      expect(res.status).toBe(201);
      groupId = res.body.data.id;
      inviteCode = res.body.data.inviteCode;
    });

    it('Step B: Member successfully joins the group', async () => {
      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ inviteCode });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('MEMBER');
    });

    it('Step C: Admin generates the rotation schedule', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/rotation/generate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mode: 'JOIN_ORDER', startDate: new Date().toISOString() });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(2); // 2 Members = 2 Slots
    });

    it('Step D: Members submit contributions (Atomic Wallet Deduction)', async () => {
      // Member pays 50k
      const resMember = await request(app)
        .post(`/api/v1/groups/${groupId}/contributions`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(resMember.status).toBe(200);

      // We manually fund the admin to complete the pot
      const adminWallet = await prisma.wallet.findUnique({ where: { userId: adminId } });
      await prisma.wallet.update({ where: { id: adminWallet!.id }, data: { balance: 50000 } });

      // Admin pays 50k
      const resAdmin = await request(app)
        .post(`/api/v1/groups/${groupId}/contributions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(200);

      // Verify the Group Vault has exactly 100k
      const group = await prisma.group.findUnique({ where: { id: groupId }, include: { wallet: true } });
      expect(group?.wallet?.balance).toBe(100000);
    });

    it('Step E: System successfully processes payout to the first rotation slot', async () => {
      // ⭐️ Instead of waiting for the Bull Queue worker to pick up the job,
      // we import the exact service function the worker uses and run it directly in the test!
      const result = await payoutService.processNextPayout(groupId);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(100000);

      // Verify database integrity
      const groupVault = await prisma.wallet.findUnique({ where: { groupId } });
      expect(groupVault?.balance).toBe(0); // The 100k pot was emptied!

      // Verify the first slot is marked PAID
      const slots = await prisma.rotationSlot.findMany({ where: { groupId }, orderBy: { position: 'asc' } });
      expect(slots[0].status).toBe('PAID');
      expect(slots[1].status).toBe('PENDING'); // Second person is still waiting for Cycle 2
    });
  });
});