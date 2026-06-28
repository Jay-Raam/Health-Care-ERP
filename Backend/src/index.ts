import { createServer } from 'http';
import { createApp } from './server.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { initRedis } from './shared/cache/redis.js';
import { initQueues } from './shared/queue/bullmq.js';
import { initWorkers } from './shared/workers/queueWorkers.js';
import { initSocketServer } from './shared/socket/socketServer.js';
import { logger } from './shared/logs/logger.js';

const startServer = async () => {
  try {
    logger.info('Initializing enterprise AI Hospital backend application...');

    // 1. Initialize DB and Cache
    await connectDatabase();
    initRedis();

    // 2. Initialize Queues and background workers
    await initQueues();
    initWorkers();

    // 3. Setup Express app & HTTP Server
    const app = createApp();
    const server = createServer(app);

    // 4. Connect WebSockets
    initSocketServer(server);

    // 5. Start Server Listener
    server.listen(config.PORT, () => {
      logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
      logger.info(`GraphQL Endpoint: http://localhost:${config.PORT}/graphql`);
      logger.info(`REST Health Check: http://localhost:${config.PORT}/api/health`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal: string) => {
      logger.warn(`Received ${signal}. Starting graceful shutdown...`);
      
      // Close HTTP and Socket connections first
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Disconnect database and cache clients
          await disconnectDatabase();
          
          const redis = initRedis();
          await redis.quit();
          logger.info('Redis client disconnected');
          
          logger.info('Graceful shutdown completed. Exiting.');
          process.exit(0);
        } catch (error) {
          logger.error(error, 'Error during shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown: timeout reached');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: any) {
    logger.fatal(error, 'Fatal startup error: application crashed');
    process.exit(1);
  }
};

startServer();
