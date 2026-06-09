import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app'; // Your Express app (without app.listen)
import redis from '../../config/redis';
import prisma from '../../config/database';


describe('Authentication Flows', () => {
  const testUser = {
    email: 'test@ajo.com',
    phone: '08011112222',
    firstName: 'Test',
    lastName: 'User',
    password: 'password123',
    pin: '1234',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.passwordHash).toBeUndefined(); // Ensure password is stripped!

      // Verify the user and wallet were actually created in the DB
      const userInDb = await prisma.user.findUnique({ where: { email: testUser.email }, include: { wallet: true } });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.wallet).not.toBeNull();
    });

    it('should return 409 if email already exists', async () => {
      // 1. Create a user first
      await request(app).post('/api/v1/auth/register').send(testUser);
      // 2. Try to create the same user again
      const res = await request(app).post('/api/v1/auth/register').send(testUser);
      
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Setup: Register a user and manually verify them in DB before trying to log in
      await request(app).post('/api/v1/auth/register').send(testUser);
      await prisma.user.update({
        where: { email: testUser.email },
        data: { isVerified: true },
      });
    });

    it('should login successfully and return tokens', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      // Check if refresh token was actually saved to Redis
      const user = res.body.data.user;
      const storedToken = await redis.get(`refresh_token:${user.id}`);
      expect(storedToken).toBe(res.body.data.tokens.refreshToken);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should blacklist the refresh token in Redis', async () => {
      // Setup fake token in Redis
      const fakeUserId = 'fake-uuid';
      await redis.set(`refresh_token:${fakeUserId}`, 'valid-refresh-token');

      // Logout request
      const res = await request(app).post('/api/v1/auth/logout').send({
        refreshToken: 'valid-refresh-token',
      });

      expect(res.status).toBe(200);

      // Verify it was deleted from Redis
      const tokenInRedis = await redis.get(`refresh_token:${fakeUserId}`);
      expect(tokenInRedis).toBeNull();
    });
  });
});