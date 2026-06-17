import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import prisma from '../../config/database'; // Or '../../config/prisma'
import { env } from '../../config/env';

describe('Group Module Integration Tests', () => {
  let adminToken: string;
  let memberToken: string;
  let adminId: string;
  let memberId: string;

  // Helper to create users and generate tokens before tests
  beforeEach(async () => {
    // 1. Create two test users in the database
    const admin = await prisma.user.create({
      data: { email: 'admin@ajo.com', phone: '08011111111', firstName: 'Admin', lastName: 'User', passwordHash: 'hash' },
    });
    const member = await prisma.user.create({
      data: { email: 'member@ajo.com', phone: '08022222222', firstName: 'Member', lastName: 'User', passwordHash: 'hash' },
    });

    adminId = admin.id;
    memberId = member.id;

    // 2. Generate valid JWT access tokens for both users
    adminToken = jwt.sign({ id: admin.id }, env.JWT_SECRET, { expiresIn: '15m' });
    memberToken = jwt.sign({ id: member.id }, env.JWT_SECRET, { expiresIn: '15m' });
  });

  describe('POST /api/v1/groups', () => {
    it('should create a new group, wallet, and assign the creator as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Savings Group',
          contributionAmount: 50000,
          frequency: 'MONTHLY',
          maxCapacity: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Savings Group');
      expect(res.body.data.inviteCode).toBeDefined();

      // Verify DB writes
      const groupInDb = await prisma.group.findUnique({
        where: { id: res.body.data.id },
        include: { members: true, wallet: true },
      });

      expect(groupInDb?.wallet).not.toBeNull();
      expect(groupInDb?.members[0].role).toBe('ADMIN');
      expect(groupInDb?.members[0].userId).toBe(adminId);
    });
  });

  describe('POST /api/v1/groups/join', () => {
    it('should allow a user to join via invite code and block duplicates', async () => {
      // 1. Admin creates group
      const createRes = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Join Test', contributionAmount: 10000 });

      const inviteCode = createRes.body.data.inviteCode;

      // 2. Member joins using the code
      const joinRes = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ inviteCode });

      expect(joinRes.status).toBe(200);
      expect(joinRes.body.data.role).toBe('MEMBER');

      // 3. Try to join again (Duplicate Check)
      const duplicateRes = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ inviteCode });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toContain('already a member');
    });
  });

  describe('Rotation Engine (/rotation)', () => {
    let groupId: string;

    beforeEach(async () => {
      // Setup: Create a group and add User 2 so we have 2 members
      const createRes = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Rotation Test', contributionAmount: 10000, frequency: 'MONTHLY' });
      
      groupId = createRes.body.data.id;
      const inviteCode = createRes.body.data.inviteCode;

      await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ inviteCode });
    });

    it('should generate rotation slots and return the timeline', async () => {
      // 1. Generate Rotation (Admin Only)
      const generateRes = await request(app)
        .post(`/api/v1/groups/${groupId}/rotation/generate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mode: 'JOIN_ORDER', startDate: new Date().toISOString() });

      expect(generateRes.status).toBe(201);
      expect(generateRes.body.data.length).toBe(2); // 2 members = 2 slots

      // 2. Fetch the Timeline Endpoint
      const timelineRes = await request(app)
        .get(`/api/v1/groups/${groupId}/rotation`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(timelineRes.status).toBe(200);
      // Verify our enriched data structure !
      expect(timelineRes.body.data).toHaveProperty('currentTurn');
      expect(timelineRes.body.data).toHaveProperty('progress');
      expect(timelineRes.body.data).toHaveProperty('timeline');
      
      // Verify that progress starts at 0%
      expect(timelineRes.body.data.progress.percentage).toBe(0);
      expect(timelineRes.body.data.timeline.length).toBe(2);
    });
  });
});