import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateFingerprint } from '../utils/fingerprint.js';
import { requireSession } from '../middleware/session.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import pool from '../utils/db.js';
import redis from '../utils/redis.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password does not meet security requirements',
        errors: passwordCheck.errors,
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password, username, status) 
       VALUES ($1, $2, $3, 'active') 
       RETURNING id, email, username, created_at`,
      [email.toLowerCase(), hashedPassword, username]
    );

    const user = result.rows[0];

    // Create session
    const fingerprint = generateFingerprint(req);
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.fingerprint = fingerprint;
    req.session.createdAt = Date.now();
    req.session.lastActivity = Date.now();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.created_at,
        },
        sessionId: req.sessionID,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, email, password, username, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account inactive',
        message: 'Your account is not active. Please contact support.',
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({
          success: false,
          error: 'Login failed',
          message: 'An error occurred during login',
        });
      }

      // Create session
      const fingerprint = generateFingerprint(req);
      req.session.userId = user.id;
      req.session.email = user.email;
      req.session.fingerprint = fingerprint;
      req.session.createdAt = Date.now();
      req.session.lastActivity = Date.now();
      req.session.rememberMe = rememberMe;

      // Set longer cookie expiration for "remember me"
      if (rememberMe) {
        const rememberMeTimeout = parseInt(process.env.SESSION_REMEMBER_ME_TIMEOUT ?? '604800000', 10);
        req.session.cookie.maxAge = rememberMeTimeout; // 7 days
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
          sessionId: req.sessionID,
        },
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (protected route)
 */
router.get('/me', requireSession, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        session: {
          id: req.sessionID,
          createdAt: new Date(req.session.createdAt).toISOString(),
          expiresAt: new Date(Date.now() + req.session.cookie.maxAge).toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while fetching user data',
    });
  }
});

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions', requireSession, async (req, res) => {
  try {
    const keyPrefix = process.env.REDIS_KEY_PREFIX ?? 'sess:';
    const keys = await redis.keys(`${keyPrefix}*`);
    const sessions = [];

    for (const key of keys) {
      const sessionData = await redis.get(key);
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          if (parsed.userId === req.session.userId) {
            const sessionId = key.replace(keyPrefix, '');
            sessions.push({
              id: sessionId,
              ipAddress: parsed.fingerprint?.ip ?? 'unknown',
              userAgent: parsed.fingerprint?.userAgent ?? 'unknown',
              createdAt: parsed.createdAt ? new Date(parsed.createdAt).toISOString() : null,
              lastActivity: parsed.lastActivity ? new Date(parsed.lastActivity).toISOString() : null,
              isCurrent: sessionId === req.sessionID,
            });
          }
        } catch {
          // Skip invalid session data
        }
      }
    }

    res.json({
      success: true,
      data: {
        sessions,
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while fetching sessions',
    });
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', requireSession, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const keyPrefix = process.env.REDIS_KEY_PREFIX ?? 'sess:';
    const key = `${keyPrefix}${sessionId}`;

    // Get session data to verify ownership
    const sessionData = await redis.get(key);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        message: 'The specified session does not exist',
      });
    }

    const parsed = JSON.parse(sessionData);
    if (parsed.userId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only revoke your own sessions',
      });
    }

    // Delete the session
    await redis.del(key);

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while revoking the session',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (protected route)
 */
router.post('/logout', requireSession, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }

    res.clearCookie('sessionId');
    res.json({
      success: true,
      message: 'Logout successful',
    });
  });
});

export default router;
