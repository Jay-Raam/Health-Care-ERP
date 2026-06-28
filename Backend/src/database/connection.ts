import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../shared/logs/logger.js';

const MONGO_URI = config.MONGO_URI;

export const connectDatabase = async (): Promise<void> => {
  const options = {
    autoIndex: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  mongoose.connection.on('connecting', () => {
    logger.info('Connecting to MongoDB...');
  });

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully');
  });

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(MONGO_URI, options);
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase();
    } catch (err) {
      logger.error(err, 'Failed to connect to MongoDB on startup - retrying in 5 sec');
      setTimeout(connectWithRetry, 5000);
    }
  };

  await connectWithRetry();
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected successfully through server shutdown');
};
