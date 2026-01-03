const express = require('express');
const pool = require('../utils/db');
const { hashPassword, comparePassword, validatePassword } = require('../utils/password');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { requireSession } = require('../middleware/session');
const { getFingerprintComponents, computeFingerprint } = require('../utils/fingerprint');

function normalizeSessionKey(prefix, sessionIdOrKey) {
  if (!sessionIdOrKey) return null;
  return sessionIdOrKey.startsWith(prefix) ? sessionIdOrKey : `${prefix}${sessionIdOrKey}`;
}

module.exports = function createAuthRoutes({ redisClient, prefix }) {
  const router = express.Router();

  router.post('/register', validateRegistration, async (req, res) => {
    try {
      const { email, password, username } = req.body;

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Weak password',
          message: 'Password does not meet security requirements',
          errors: passwordCheck.errors
        });
      }

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'User exists',
          message: 'A user with this email already exists'
        });
      }

      const passwordHash = await hashPassword(password);
      const created = await pool.query(
        `INSERT INTO users (email, password_hash, username, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id, email, username`,
        [email.toLowerCase(), passwordHash, username]
      );

      const user = created.rows[0];

      // Establish session
      const { ip, userAgent } = getFingerprintComponents(req);
      req.session.user = { userId: user.id, email: user.email, username: user.username };
      req.session.fingerprint = computeFingerprint({ ip, userAgent });
      req.session.createdAt = new Date().toISOString();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          sessionId: `${prefix}${req.sessionID}`
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, error: 'Registration failed', message: 'An error occurred during registration' });
    }
  });

  router.post('/login', validateLogin, async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;

      const result = await pool.query(
        'SELECT id, email, password_hash, username, status FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' });
      }

      const user = result.rows[0];
      if (user.status !== 'active') {
        return res.status(403).json({ success: false, error: 'Account inactive', message: 'Your account is not active. Please contact support.' });
      }

      const ok = await comparePassword(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' });
      }

      const { ip, userAgent } = getFingerprintComponents(req);
      req.session.user = { userId: user.id, email: user.email, username: user.username };
      req.session.fingerprint = computeFingerprint({ ip, userAgent });
      req.session.createdAt = new Date().toISOString();

      if (rememberMe) {
        const rememberTimeout = Number(process.env.SESSION_REMEMBER_ME_TIMEOUT || 7 * 24 * 60 * 60 * 1000);
        req.session.cookie.maxAge = rememberTimeout;
        req.session.rememberMe = true;
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: { id: user.id, email: user.email, username: user.username },
          sessionId: `${prefix}${req.sessionID}`
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed', message: 'An error occurred during login' });
    }
  });

  router.get('/me', requireSession, async (req, res) => {
    res.json({
      success: true,
      data: {
        user: req.session.user,
        session: {
          id: `${prefix}${req.sessionID}`,
          createdAt: req.session.createdAt,
          expiresAt: new Date(Date.now() + (req.session.cookie.maxAge || 0)).toISOString()
        }
      }
    });
  });

  router.get('/sessions', requireSession, async (req, res) => {
    const userId = req.session.user.userId;
    const sessions = [];
    let cursor = '0';

    try {
      do {
        // Scan keys under the session prefix
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
        cursor = nextCursor;

        for (const key of keys) {
          const raw = await redisClient.get(key);
          if (!raw) continue;
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            continue;
          }

          if (data?.user?.userId !== userId) continue;

          sessions.push({
            id: key,
            ipAddress: data?.fingerprint ? 'stored' : undefined,
            userAgent: data?.user ? undefined : undefined,
            createdAt: data?.createdAt,
            lastActivity: data?.cookie?.expires,
            isCurrent: key === `${prefix}${req.sessionID}`
          });
        }
      } while (cursor !== '0');

      res.json({ success: true, data: { sessions } });
    } catch (error) {
      console.error('List sessions error:', error);
      res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to list sessions' });
    }
  });

  router.delete('/sessions/:sessionKey', requireSession, async (req, res) => {
    const key = normalizeSessionKey(prefix, req.params.sessionKey);
    if (!key) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Session key is required' });
    }

    // Prevent deleting current session via this endpoint (optional)
    if (key === `${prefix}${req.sessionID}`) {
      return res.status(400).json({ success: false, error: 'Invalid request', message: 'Use /logout to revoke current session' });
    }

    await redisClient.del(key);
    res.json({ success: true, message: 'Session revoked successfully' });
  });

  router.post('/logout', requireSession, async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, error: 'Logout failed', message: 'An error occurred during logout' });
      }
      res.clearCookie('sid');
      res.json({ success: true, message: 'Logout successful' });
    });
  });

  return router;
};

