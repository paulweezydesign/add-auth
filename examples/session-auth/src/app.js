require('dotenv').config();

const express = require('express');
const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { createRedisClient } = require('./utils/redis');

const authRoutes = require('./routes/auth');

const app = express();

// Basic parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session store (Redis)
const redisClient = createRedisClient();
const prefix = process.env.REDIS_KEY_PREFIX || 'sess:';

const cookieSecure = String(process.env.COOKIE_SECURE || 'false') === 'true';
const sessionTimeout = Number(process.env.SESSION_TIMEOUT || 24 * 60 * 60 * 1000);

app.set('trust proxy', 1);
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new RedisStore({ client: redisClient, prefix }),
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'strict',
      maxAge: sessionTimeout,
      path: '/'
    }
  })
);

// Routes
app.use('/api/auth', authRoutes({ redisClient, prefix }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Session Auth Example API is running', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found', message: 'The requested endpoint does not exist' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

module.exports = { app, redisClient };

