import mongoose from 'mongoose';
import { MONGO_URI, DB_NAME } from '@config';
import { logger } from '@utils/logger';

export const connectToDatabase = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  logger.info(`MongoDB connected — db: ${DB_NAME}`);
};
