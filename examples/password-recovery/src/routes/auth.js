import express from 'express';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import { generateResetToken, hashToken, getTokenExpiry } from '../utils/token.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/email.js';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../utils/db.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email, password, and username are required',
      });
    }

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

    // Generate token
    const accessToken = generateAccessToken(user.id, user.email);

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
        accessToken,
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email and password are required',
      });
    }

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

    // Generate token
    const accessToken = generateAccessToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken,
      },
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1',
      [req.user.userId]
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
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email is required',
      });
    }

    // Always return the same response to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    // Find user
    const result = await pool.query(
      'SELECT id, email, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // User doesn't exist, but return generic response
      return res.json(genericResponse);
    }

    const user = result.rows[0];

    // Check if account is active
    if (user.status !== 'active') {
      return res.json(genericResponse);
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = getTokenExpiry();
    const ipAddress = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    // Delete any existing tokens for this user
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Store new token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt, ipAddress, userAgent]
    );

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while processing your request',
    });
  }
});

/**
 * POST /api/auth/validate-reset-token
 * Validate password reset token
 */
router.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Token is required',
      });
    }

    const tokenHash = hashToken(token);

    // Find token
    const result = await pool.query(
      `SELECT prt.*, u.email
       FROM password_reset_tokens prt
       INNER JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This password reset link is invalid or has expired.',
      });
    }

    const tokenData = result.rows[0];

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: tokenData.email,
      },
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      message: 'An error occurred while validating the token',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Token and new password are required',
      });
    }

    // Validate password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password does not meet security requirements',
        errors: passwordCheck.errors,
      });
    }

    const tokenHash = hashToken(token);

    // Find token
    const result = await pool.query(
      `SELECT prt.*, u.email
       FROM password_reset_tokens prt
       INNER JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This password reset link is invalid or has expired.',
      });
    }

    const tokenData = result.rows[0];

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, tokenData.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );

    // Send confirmation email
    const ipAddress = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    await sendPasswordChangedEmail(tokenData.email, ipAddress);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Reset failed',
      message: 'An error occurred while resetting your password',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change password (authenticated)
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Current password and new password are required',
      });
    }

    // Validate new password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'New password does not meet security requirements',
        errors: passwordCheck.errors,
      });
    }

    // Get user
    const result = await pool.query(
      'SELECT id, email, password FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is same as current
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'Same password',
        message: 'New password must be different from current password',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Send confirmation email
    const ipAddress = req.ip ?? req.connection?.remoteAddress ?? 'unknown';
    await sendPasswordChangedEmail(user.email, ipAddress);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Change failed',
      message: 'An error occurred while changing your password',
    });
  }
});

export default router;
