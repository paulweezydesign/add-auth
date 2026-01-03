const crypto = require('crypto');
const express = require('express');

const pool = require('../utils/db');
const { hashPassword, comparePassword, validatePassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');
const {
  validateEmailOnly,
  validateTokenOnly,
  validateResetPassword,
  validateChangePassword,
  validateRegister,
  validateLogin
} = require('../middleware/validation');
const { sendResetEmail, sendPasswordChangedEmail } = require('../utils/email');

const router = express.Router();

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getResetConfig() {
  return {
    expiryMs: Number(process.env.RESET_TOKEN_EXPIRY || 60 * 60 * 1000),
    tokenBytes: Number(process.env.RESET_TOKEN_LENGTH || 32),
    maxAttempts: Number(process.env.MAX_RESET_ATTEMPTS || 3),
    cooldownMs: Number(process.env.RESET_COOLDOWN || 15 * 60 * 1000),
    baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3004}`
  };
}

async function isRateLimited(email) {
  const { maxAttempts, cooldownMs } = getResetConfig();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS cnt
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE u.email = $1 AND prt.created_at > NOW() - ($2::int || ' milliseconds')::interval`,
    [email.toLowerCase(), cooldownMs]
  );
  return result.rows[0].cnt >= maxAttempts;
}

// Self-contained helpers (not in README, but useful to test change-password)
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, error: 'Weak password', errors: passwordCheck.errors });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'User exists', message: 'A user with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const created = await pool.query(
      `INSERT INTO users (email, password_hash, username, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, email, username`,
      [email.toLowerCase(), passwordHash, username]
    );

    const user = created.rows[0];
    const accessToken = generateAccessToken(user.id, user.email);

    res.status(201).json({ success: true, message: 'User registered successfully', data: { user, accessToken } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT id, email, password_hash, username, status FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' });
    }
    const user = result.rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Account inactive', message: 'Your account is not active' });
    }
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' });
    }

    const accessToken = generateAccessToken(user.id, user.email);
    res.json({ success: true, message: 'Login successful', data: { user: { id: user.id, email: user.email, username: user.username }, accessToken } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// README endpoints
router.post('/forgot-password', validateEmailOnly, async (req, res) => {
  const { email } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('user-agent');

  // Always respond success to prevent user enumeration
  const generic = {
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.'
  };

  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1 AND status = $2', [email.toLowerCase(), 'active']);
    if (userResult.rows.length === 0) return res.status(200).json(generic);

    if (await isRateLimited(email)) return res.status(200).json(generic);

    const { expiryMs, tokenBytes, baseUrl } = getResetConfig();
    const rawToken = crypto.randomBytes(tokenBytes).toString('hex');
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + expiryMs);
    const userId = userResult.rows[0].id;

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tokenHash, expiresAt, ipAddress, userAgent]
    );

    const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;
    await sendResetEmail(email, resetLink, expiresAt);

    return res.status(200).json(generic);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(200).json(generic);
  }
});

router.post('/validate-reset-token', validateTokenOnly, async (req, res) => {
  try {
    const { token } = req.body;
    const tokenHash = sha256(token);

    const result = await pool.query(
      `SELECT prt.expires_at, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This password reset link is invalid or has expired.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { email: result.rows[0].email }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/reset-password', validateResetPassword, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, error: 'Weak password', errors: passwordCheck.errors });
    }

    const tokenHash = sha256(token);
    const tokenResult = await pool.query(
      `SELECT prt.user_id
       FROM password_reset_tokens prt
       WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()
       ORDER BY prt.created_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This password reset link is invalid or has expired.'
      });
    }

    const userId = tokenResult.rows[0].user_id;
    const passwordHash = await hashPassword(newPassword);

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
    await pool.query('COMMIT');

    // Best-effort email notification
    const emailResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (emailResult.rows[0]?.email) await sendPasswordChangedEmail(emailResult.rows[0].email);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    try {
      await pool.query('ROLLBACK');
    } catch {}
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to reset password' });
  }
});

router.post('/change-password', authenticateToken, validateChangePassword, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, error: 'Weak password', errors: passwordCheck.errors });
    }

    const userResult = await pool.query('SELECT id, email, password_hash FROM users WHERE id = $1', [req.user.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    const user = userResult.rows[0];
    const ok = await comparePassword(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', message: 'Current password is incorrect' });
    }

    const newHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);

    await sendPasswordChangedEmail(user.email);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

