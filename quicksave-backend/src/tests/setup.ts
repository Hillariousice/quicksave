import prisma from '../config/prisma';

// 1. Mock Nodemailer so we don't send real emails during tests
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// 2. Mock Redis so we don't hit the cloud database during tests
jest.mock('../config/redis', () => {
  const Redis = require('ioredis-mock');
  return new Redis();
});

// 3. Clean the Postgres database before every single test
beforeEach(async () => {
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
});

// 4. Disconnect Prisma after all tests finish
afterAll(async () => {
  await prisma.$disconnect();
});