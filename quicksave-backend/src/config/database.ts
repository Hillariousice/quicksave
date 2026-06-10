import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

const isAccelerate = env.DATABASE_URL.startsWith('prisma://') || env.DATABASE_URL.startsWith('prisma+postgres://');

// Helper function to return the correctly configured client
const getBaseClient = () => {
  if (isAccelerate) {
    // Production/Dev: Use the cloud engine via Prisma Accelerate
    return new PrismaClient({ accelerateUrl: env.DATABASE_URL });
  } else {
    // Testing/Local: Use the native Postgres driver adapter
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
};

// Initialize the client and attach the extension
const prisma = getBaseClient().$extends(withAccelerate());

export default prisma;