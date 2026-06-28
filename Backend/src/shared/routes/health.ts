import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { checkRedisStatus } from '../cache/redis.js';
import { emailQueue } from '../queue/bullmq.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const redisStatus = checkRedisStatus() ? 'UP' : 'DOWN';
  
  let queueStatus = 'UP';
  try {
    const client = await emailQueue.client;
    if (!client) queueStatus = 'DOWN';
  } catch {
    queueStatus = 'DOWN';
  }

  const memory = process.memoryUsage();
  const uptime = process.uptime();

  const isHealthy = mongoStatus === 'UP' && redisStatus === 'UP';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    services: {
      database: mongoStatus,
      cache: redisStatus,
      queues: queueStatus
    },
    metrics: {
      memoryUsage: {
        rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`
      },
      cpu: process.cpuUsage()
    }
  });
});

export default router;
