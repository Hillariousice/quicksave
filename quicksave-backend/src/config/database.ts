import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Prisma 7 syntax: pass the Accelerate URL directly to the constructor
const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL 
}).$extends(withAccelerate());

export default prisma;