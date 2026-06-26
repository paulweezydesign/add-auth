import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from '../config/passport';
import { appConfig } from '../config';
import { db } from '../database/connection';
import { createRedisClient } from '../utils/redis';
import {
  applySecurityMiddleware,
  globalErrorHandler,
  handleAuthErrors,
  securityHealthCheck,
} from '../middleware';
import authRoutes from '../routes/auth';
import passwordResetRoutes from '../routes/passwordReset';
import roleRoutes from '../routes/roles';
import oauthRoutes from '../routes/oauth';
import {
  sessionMiddleware,
  fingerprintMiddleware,
  sessionActivityMiddleware,
} from '../middleware/session';
import { logger } from '../utils/logger';

export interface CreateAppOptions {
  withOAuth?: boolean;
}

function attachOAuthRoutes(app: Express): void {
  app.use(sessionMiddleware);
  app.use(fingerprintMiddleware);
  app.use(sessionActivityMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/auth', oauthRoutes);
  logger.info('OAuth routes attached');
}

export function createApp(options: CreateAppOptions = {}): Express {
  const { withOAuth = false } = options;
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Session-Id'],
      exposedHeaders: ['X-CSRF-Token'],
    })
  );

  app.set('trust proxy', true);

  const environment =
    (appConfig.server.nodeEnv as 'production' | 'development' | 'testing') ||
    'development';
  app.use(applySecurityMiddleware(environment));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  app.get('/health', async (_req, res) => {
    try {
      const dbStatus = await db.testConnection();
      const securityStatus = await securityHealthCheck();

      let redisStatus = false;
      try {
        const redisClient = await createRedisClient();
        await redisClient.ping();
        redisStatus = true;
      } catch (error) {
        logger.warn('Redis health check failed:', error);
      }

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected',
        security: securityStatus,
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  app.get('/', (_req, res) => {
    res.json({
      message: 'Add-Auth API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/auth',
        roles: '/api/roles',
        passwordReset: '/api/password-reset',
        oauth: withOAuth ? '/auth' : null,
      },
    });
  });

  if (withOAuth) {
    attachOAuthRoutes(app);
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/password-reset', passwordResetRoutes);

  app.use(handleAuthErrors);
  app.use(globalErrorHandler);

  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested resource was not found',
    });
  });

  return app;
}

export function logAppStartup(port: number, redisConnected: boolean): void {
  logger.info(`Server running on port ${port}`, {
    environment: appConfig.server.nodeEnv,
    port,
    redis: redisConnected ? 'connected' : 'disconnected',
  });
}

export { attachOAuthRoutes };
