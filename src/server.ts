import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type http from 'http';
import { appConfig } from './config';
import { logger } from './utils/logger';

export type ServerEnvironment = 'production' | 'development' | 'testing';

export interface CreateAuthServerOptions {
  environment?: ServerEnvironment;
  corsOrigin?: string | string[];
}

export interface StartAuthServerOptions extends CreateAuthServerOptions {
  port?: number;
  onListen?: (info: { port: number; environment: ServerEnvironment }) => void;
}

export interface StartedAuthServer {
  app: express.Express;
  server: http.Server;
  close: () => Promise<void>;
}

interface DemoUserRecord {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const demoUsers = new Map<string, DemoUserRecord>();
const DEFAULT_ENVIRONMENT: ServerEnvironment =
  (appConfig.server.nodeEnv as ServerEnvironment) || 'development';

const createToken = (email: string) =>
  jwt.sign({ email }, appConfig.security.jwtSecret as jwt.Secret, {
    expiresIn: appConfig.security.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

const registerHandler: RequestHandler = async (req, res) => {
  const { email, password } = (req.body || {}) as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  if (demoUsers.has(email.toLowerCase())) {
    res.status(409).json({ error: 'A user with this email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, appConfig.security.bcryptRounds);
  demoUsers.set(email.toLowerCase(), {
    email,
    passwordHash,
    createdAt: new Date(),
  });

  logger.info('Demo user registered', { email });
  res.status(201).json({
    message: 'User registered successfully.',
    email,
  });
};

const loginHandler: RequestHandler = async (req, res) => {
  const { email, password } = (req.body || {}) as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = demoUsers.get(email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = createToken(user.email);
  res.json({
    message: 'Login successful.',
    token,
    user: { email: user.email },
  });
};

const meHandler: RequestHandler = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token missing.' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, appConfig.security.jwtSecret as jwt.Secret) as { email: string };
    res.json({
      message: 'Token is valid.',
      user: { email: decoded.email },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const createAuthServer = (
  options: CreateAuthServerOptions = {}
): express.Express => {
  const environment = options.environment || DEFAULT_ENVIRONMENT;
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: options.corsOrigin || process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      environment,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/auth/register', registerHandler);
  app.post('/api/auth/login', loginHandler);
  app.get('/api/auth/me', meHandler);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
};

export const startAuthServer = async (
  options: StartAuthServerOptions = {}
): Promise<StartedAuthServer> => {
  const environment = options.environment || DEFAULT_ENVIRONMENT;
  const app = createAuthServer({ ...options, environment });
  const port = options.port || appConfig.server.port;

  const server = app.listen(port, () => {
    logger.info(`Auth server listening on port ${port}`, { environment });
    options.onListen?.({ port, environment });
  });

  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };

  return { app, server, close };
};

export const registerGracefulShutdown = (started: StartedAuthServer) => {
  const shutdown = async () => {
    logger.info('Received shutdown signal, closing server');
    await started.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
