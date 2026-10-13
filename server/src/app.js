import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import routes from './routes/index.js';

const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '').toLowerCase();

export function createApp() {
  const app = express();
  const allowedOrigins = new Set((env.clientUrls || [env.clientUrl]).map(normalizeOrigin));

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOrigins.has(normalizedOrigin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(compression());
  app.use(mongoSanitize());
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Global rate limiter (auth + AI routers add stricter limits of their own).
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    })
  );

  app.get('/health', (req, res) =>
    res.json({ success: true, message: 'WCEConnect AI API healthy', data: { time: new Date().toISOString() } })
  );

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export default createApp;
