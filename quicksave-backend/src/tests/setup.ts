import { jest, beforeEach, afterAll } from '@jest/globals';
import prisma from '../config/database';


jest.setTimeout(30000); 
// 1. Mock Nodemailer
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn(() => Promise.resolve()), 
}));

// 2. Mock Redis
jest.mock('../config/redis', () => {
  const Redis = require('ioredis-mock');
  return new Redis();
});

// 👉 3. FIX: Mock the Rate Limiters so they don't crash tests or block requests
jest.mock('../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
}));

// 4. Clean the Postgres database before every single test
// 4. Clean the Postgres database before every single test
beforeEach(async () => {
  // 1st: Delete the deepest child tables
  await prisma.activityLog.deleteMany();
  await prisma.rotationSlot.deleteMany();
  await prisma.contribution.deleteMany();
  
  // 2nd: Delete the middle-tier relation tables
  await prisma.groupMember.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.wallet.deleteMany();

  // 3rd: Now that no child depends on them, it is safe to delete the parents!
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
});

// 5. Disconnect Prisma after all tests finish
afterAll(async () => {
  await prisma.$disconnect();
});