// 1. Import env first so it validates variables immediately
import { env } from './config/env';
import { logger } from './config/logger';
import app from './app'; // Import the Express app we configured
import { initSocket } from './config/socket';
import http from 'http';
import { initScheduler } from './queues/scheduler.queue';




// Define a function to start the server
const startServer = async () => {
  try {
    // You can connect to Redis or Prisma here in the future before starting the app!
    const server = http.createServer(app);

    initSocket(server);

    await initScheduler();

    const PORT = process.env.PORT || env.PORT || 3000;

    server.listen(PORT, () => {
      console.log(`\n✅ SERVER BOOTED SUCCESSFULLY ON PORT ${PORT}\n`);
      logger.info(`🚀 Quicksave backend & Socket.io running on port ${PORT}`);
    });
  } catch (error: any) {
    console.error('\n❌ FATAL ERROR DURING STARTUP:\n', error);
    logger.error(error, '❌ Failed to start the server:');
    process.exit(1);
  }
};

startServer();