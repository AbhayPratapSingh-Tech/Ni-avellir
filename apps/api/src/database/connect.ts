import mongoose from 'mongoose';
import { logger } from '../common/logger/logger.js';

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info({ uri: sanitizeUri(uri) }, 'MongoDB connected');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

function sanitizeUri(uri: string): string {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}
