import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import { logger } from './logger';

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
const prisma = getBaseClient()
  .$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        const result = await query(args); // Execute the actual query
        const end = performance.now();
        const time = (end - start).toFixed(2);

        // Log if it took longer than 50ms (PostgreSQL should be blazingly fast)
        if (Number(time) > 50) {
          logger.warn({ model, operation, timeMs: Number(time) }, `[Prisma 🐢] ${model}.${operation} took ${time}ms`);
        } else {
          logger.debug({ model, operation, timeMs: Number(time) }, `[Prisma ⚡] ${model}.${operation} took ${time}ms`);
        }
        
        return result;
      }
    }
  })
  .$extends(withAccelerate());

export default prisma;