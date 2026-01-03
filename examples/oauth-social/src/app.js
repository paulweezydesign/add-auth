require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { RedisStore } = require('connect-redis');

const { createRedisClient } = require('./utils/redis');
const { configurePassport } = require('./config/passport');
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static UI
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session store (Redis)
const redisClient = createRedisClient();
const prefix = process.env.REDIS_KEY_PREFIX || 'sess:';

app.set('trust proxy', 1);
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({ client: redisClient, prefix }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

// Passport
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OAuth Social Example API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found', message: 'The requested endpoint does not exist' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

module.exports = { app, redisClient };

