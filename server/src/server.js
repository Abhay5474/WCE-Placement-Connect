import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initSockets } from './sockets/index.js';

async function start() {
  await connectDB();
  const app = createApp();
  const server = http.createServer(app);

  // Real-time notifications
  initSockets(server);

  server.listen(env.port, () => {
    logger.info(`WCEConnect AI API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`AI provider: ${env.ai.provider} | Vector backend: ${env.vector.backend}`);
  });

  const shutdown = (sig) => {
    logger.warn(`${sig} received, shutting down...`);
    server.close(() => process.exit(0));
  };
  ['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
  process.on('unhandledRejection', (e) => logger.error('unhandledRejection', e));
}

start().catch((e) => {
  logger.error('Fatal startup error', e);
  process.exit(1);
});
