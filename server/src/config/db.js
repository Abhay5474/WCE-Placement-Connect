import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

// On some networks (college / VPN / captive DNS) Node's resolver can't perform
// the SRV lookup that `mongodb+srv://` needs, failing with `querySrv ECONNREFUSED`.
// Pointing Node at a reachable public DNS server fixes it without changing the URI.
if (env.dnsServers.length) {
  try {
    dns.setServers(env.dnsServers);
    logger.info(`DNS resolver set to: ${env.dnsServers.join(', ')}`);
  } catch (err) {
    logger.warn(`Could not set custom DNS servers: ${err.message}`);
  }
}

export async function connectDB(uri = env.mongoUri) {
  try {
    await mongoose.connect(uri, {
      autoIndex: !env.isProd,
      dbName: env.mongoDbName, // ensures data lands in the intended database
      serverSelectionTimeoutMS: 15000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    if (/querySrv|ENOTFOUND|ECONNREFUSED/.test(err.message)) {
      logger.error(
        'DNS/SRV lookup failed. If using a mongodb+srv:// URI, set DNS_SERVERS=1.1.1.1,8.8.8.8 ' +
          'in server/.env, or switch to the non-SRV (mongodb://) connection string from Atlas.'
      );
    }
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default connectDB;
