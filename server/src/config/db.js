import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = env.mongoUri) {
  try {
    await mongoose.connect(uri, { autoIndex: !env.isProd });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default connectDB;
