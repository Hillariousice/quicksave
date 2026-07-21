// 1. Import env first so it validates variables immediately
import { env } from './config/env'; 
import { logger } from './config/logger';
import app from './app'; // Import the Express app we configured
import { initSocket } from './config/socket';
import http from 'http';
import { initScheduler } from './queues/scheduler.queue';

const PORT = process.env.PORT || env.PORT || 5000;
// Define a function to start the server
const startServer = async () => {
  try {
    // You can connect to Redis or Prisma here in the future before starting the app!
    const server = http.createServer(app);

    initSocket(server);
  
    await initScheduler();

    server.listen(PORT, () => {
      logger.info(`🚀 Quicksave backend running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error(error,'❌ Failed to start the server:');
    process.exit(1);
  }
};

startServer();