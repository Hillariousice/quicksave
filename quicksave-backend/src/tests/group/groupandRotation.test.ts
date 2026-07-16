import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database'; // Or config/prisma
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

describe('Group & Rotation Services Integration', () => {
  let adminToken: string;
  let member1Token: string;
  let member2Token: string;
  
  let adminId: string;
  let member1Id: string;
  
  let groupId: string;
  let inviteCode: string;

  beforeAll(async () => {
    // 1. Scaffold 3 test users in the database
    const [admin, m1, m2] = await Promise.all([
      prisma.user.create({ data: { email: 'admin@ajo.com', phone: '111', firstName: 'Admin', lastName: 'User', passwordHash: 'hash' } }),
      prisma.user.create({ data: { email: 'm1@ajo.com', phone: '222', firstName: 'Member', lastName: 'One', passwordHash: 'hash' } }),
      prisma.user.create({ data: { email: 'm2@ajo.com', phone: '333', firstName: 'Member', lastName: 'Two', passwordHash: 'hash' } })
    ]);

    adminId = admin.id;
    member1Id = m1.id;

    // 2. Generate their Auth Tokens
    adminToken = jwt.sign({ id: admin.id }, env.JWT_SECRET);
    member1Token = jwt.sign({ id: m1.id }, env.JWT_SECRET);
    member2Token = jwt.sign({ id: m2.id }, env.JWT_SECRET);
  });

  describe('1. Group Service: Creation & Capacity', () => {
    it('should securely create a group, assign ADMIN role, and provision a vault', async () => {
      const res = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Rotation Group',
          contributionAmount: 50000,
          frequency: 'MONTHLY',
          maxCapacity: 2, // ⭐️ Notice we set max capacity to 2 to test limits!
        });

      expect(res.status).toBe(201);
      expect(res.body.data.inviteCode).toBeDefined();
      
      groupId = res.body.data.id;
      inviteCode = res.body.data.inviteCode;

      // Verify DB writes
      const groupInDb = await prisma.group.findUnique({
        where: { id: groupId },
        include: { members: true, wallet: true },
      });

      expect(groupInDb?.wallet).not.toBeNull();
      expect(groupInDb?.members[0].role).toBe('ADMIN');
      expect(groupInDb?.members[0].userId).toBe(adminId);
    });

    it('should allow a member to join via invite code', async () => {
      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ inviteCode });

      expect(res.status).toBe(200);
      expect(res.body.data.groupId).toBe(groupId);
      expect(res.body.data.userId).toBe(member1Id);
    });

    it('should block a user from joining the same group twice', async () => {
      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ inviteCode });

      // Our Day 70 DB locks and checks should catch this!
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already a member');
    });

    it('should block new joins when max capacity is reached', async () => {
      // The group currently has Admin + Member 1 (Total: 2). Max Capacity is 2.
      // Member 2 should be rejected!
      const res = await request(app)
        .post('/api/v1/groups/join')
        .set('Authorization', `Bearer ${member2Token}`)
        .send({ inviteCode });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('maximum capacity');
    });
  });

  describe('2. Rotation Service: Scheduling Algorithms', () => {
    it('should block non-admins from generating the rotation', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/rotation/generate`)
        .set('Authorization', `Bearer ${member1Token}`) // Using member token!
        .send({ mode: 'JOIN_ORDER', startDate: new Date().toISOString() });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the group admin');
    });

    it('should generate rotation slots accurately based on frequency', async () => {
      const startDate = new Date(); // Today
      
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/rotation/generate`)
        .set('Authorization', `Bearer ${adminToken}`) // Using Admin token
        .send({ mode: 'JOIN_ORDER', startDate: startDate.toISOString() });

      expect(res.status).toBe(201);
      
      const slots = res.body.data;
      expect(slots.length).toBe(2); // Should have generated 2 slots for 2 members

      // Verify the math: It's a MONTHLY group, so Slot 2 should be exactly 1 month after Slot 1
      const slot1Date = new Date(slots[0].expectedPayoutDate);
      const slot2Date = new Date(slots[1].expectedPayoutDate);
      
      const expectedSlot2Month = (slot1Date.getMonth() + 1) % 12; // Handle December wrapping
      
      expect(slot2Date.getMonth()).toBe(expectedSlot2Month);
      expect(slots[0].position).toBe(1);
      expect(slots[1].position).toBe(2);
    });

    it('should change group status to ACTIVE after generation', async () => {
      const groupInDb = await prisma.group.findUnique({ where: { id: groupId } });
      expect(groupInDb?.status).toBe('ACTIVE');
    });

    it('should prevent generating rotation more than once', async () => {
      const res = await request(app)
        .post(`/api/v1/groups/${groupId}/rotation/generate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mode: 'JOIN_ORDER', startDate: new Date().toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been generated');
    });
  });
});