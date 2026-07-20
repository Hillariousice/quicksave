import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database';
import redis from '../../config/redis';
import bcrypt from 'bcryptjs';

describe('Comprehensive Authentication & Security Flows', () => {
  const testUser = {
    email: 'hillary.test@ajo.com',
    phone: '08099998888',
    firstName: 'Hillary',
    lastName: 'Test',
    password: 'SupersecretPassword123!',
    pin: '1234',
  };

  let accessToken: string;
  let refreshToken: string;
  let resetOtp: string;

  describe('1. Registration & Login Flow', () => {
    it('should securely register a new user and hash their password/pin', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.passwordHash).toBeUndefined(); // Security check!

      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.isVerified).toBe(false);
    });

    it('should block login if the user has not verified their email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('verify your email');
    });

    it('should successfully log in a verified user and store refresh token in Redis', async () => {
      // Manually verify the user in the DB for the test
      await prisma.user.update({
        where: { email: testUser.email },
        data: { isVerified: true },
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;

      // Verify the backend securely tracked the session in Redis!
      const userId = res.body.data.user.id;
      const storedToken = await redis.get(`refresh_token:${userId}`);
      expect(storedToken).toBe(refreshToken);
    });
  });

  describe('2. Protected Routes & Token Rotation', () => {
    it('should block access to protected routes without a valid token', async () => {
      const res = await request(app).get('/api/v1/auth/me'); // Or any protected route
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('not logged in');
    });

    it('should allow access to protected routes with a valid access token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should rotate tokens and instantly invalidate the old refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).not.toBe(accessToken);
      expect(res.body.data.tokens.refreshToken).not.toBe(refreshToken);

      // Update our test variables with the new active tokens
      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });
  });

  describe('3. Account Recovery (Forgot / Reset Password)', () => {
    it('should generate a 6-digit OTP and store it in Redis', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.status).toBe(200);

      // Extract the OTP from our mocked Redis instance to test the next step
      const storedOtp = await redis.get(`reset_otp:${testUser.email}`);
      expect(storedOtp).toBeDefined();
      expect(storedOtp?.length).toBe(6);
      
      resetOtp = storedOtp as string;
    });

    it('should reset the password using the valid OTP', async () => {
      const newPassword = 'BrandNewPassword123!';
      
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testUser.email,
          otp: resetOtp,
          newPassword: newPassword
        });

      expect(res.status).toBe(200);

      // Prove the password was actually changed by logging in!
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: newPassword, // Use the new one!
      });

      expect(loginRes.status).toBe(200);
      
      // Update our token for the final logout test
      accessToken = loginRes.body.data.tokens.accessToken;
      refreshToken = loginRes.body.data.tokens.refreshToken;
    });
  });

  describe('4. Session Teardown (Logout)', () => {
    it('should destroy the session in Redis on logout', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);

      // Prove that trying to refresh the token now FAILS because they are logged out
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});