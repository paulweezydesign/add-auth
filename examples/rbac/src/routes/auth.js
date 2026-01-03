const express = require('express');
const pool = require('../utils/db');
const { hashPassword, comparePassword, validatePassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');
const { validateRegistration, validateLogin } = require('../middleware/validation');

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
      return res.status(409).json({ success: false, error: 'User exists', message: 'A user with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const created = await pool.query(
      `INSERT INTO users (email, password_hash, username, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, email, username, created_at`,
      [email.toLowerCase(), passwordHash, username]
    );

    const user = created.rows[0];

    // Assign default "user" role if present
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['user']);
    if (roleResult.rows.length > 0) {
      // assigned_by = user for self-registration in this example
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by)
         VALUES ($1, $2, $1)
         ON CONFLICT DO NOTHING`,
        [user.id, roleResult.rows[0].id]
      );
    }

    const accessToken = generateAccessToken(user.id, user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: user.id, email: user.email, username: user.username },
        accessToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed', message: 'An error occurred during registration' });
  }
});

router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

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

    const accessToken = generateAccessToken(user.id, user.email);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, username: user.username },
        accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed', message: 'An error occurred during login' });
  }
});

module.exports = router;

