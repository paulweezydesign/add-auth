import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';
import redis from './utils/redis.js';
import authRoutes from './routes/auth.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  credentials: true,
}));

// Session configuration with Redis store
const redisStore = new RedisStore({
  client: redis,
  prefix: process.env.REDIS_KEY_PREFIX ?? 'sess:',
});

app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET ?? 'your-super-secure-session-secret',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: parseInt(process.env.SESSION_TIMEOUT ?? '86400000', 10), // 24 hours
  },
}));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
  res.json({
    success: true,
    message: 'Session Auth Example API is running',
    timestamp: new Date().toISOString(),
    redis: redisStatus,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

export default app;
