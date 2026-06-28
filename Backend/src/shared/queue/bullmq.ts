import { Queue, QueueOptions } from 'bullmq';
import { getRedisClient } from '../cache/redis.js';
import { logger } from '../logs/logger.js';

const connection = getRedisClient();

const queueOptions: QueueOptions = {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: { age: 3600 }, // Keep completed jobs for an hour
    removeOnFail: { age: 86400 } // Keep failed jobs for 24 hours
  }
};

export const emailQueue = new Queue('EmailQueue', queueOptions);
export const pdfQueue = new Queue('PDFQueue', queueOptions);
export const notificationQueue = new Queue('NotificationQueue', queueOptions);
export const aiQueue = new Queue('AIQueue', queueOptions);
export const labOcrQueue = new Queue('LabOcrQueue', queueOptions);

// Register error listeners to prevent unhandled connection error logging
const queues = [emailQueue, pdfQueue, notificationQueue, aiQueue, labOcrQueue];
queues.forEach(queue => {
  queue.on('error', (err) => {
    logger.debug(`BullMQ Queue ${queue.name} error: ${err.message}`);
  });
});

export const initQueues = async () => {
  logger.info('BullMQ Queues initialized: Email, PDF, Notification, AI, LabOcr');
};

export const addJobToQueue = async (queue: Queue, name: string, data: any) => {
  try {
    const job = await queue.add(name, data);
    logger.debug({ queueName: queue.name, jobId: job.id, jobName: name }, `Job added to queue successfully`);
    return job;
  } catch (error) {
    logger.error({ queueName: queue.name, jobName: name, error }, `Failed to add job to queue`);
    throw error;
  }
};
