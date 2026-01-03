import express from 'express';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { generateAccessToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { getUserRoles } from '../utils/permissions.js';
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

    // Assign default 'user' role if it exists
    const defaultRole = await pool.query(
      "SELECT id FROM roles WHERE name = 'user'"
    );

    if (defaultRole.rows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, defaultRole.rows[0].id]
      );
    }

    // Get user roles for token
    const roles = await getUserRoles(user.id);
    const roleNames = roles.map((r) => r.name);

    // Generate token
    const accessToken = generateAccessToken(user.id, user.email, roleNames);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: roleNames,
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

    // Get user roles for token
    const roles = await getUserRoles(user.id);
    const roleNames = roles.map((r) => r.name);

    // Generate token
    const accessToken = generateAccessToken(user.id, user.email, roleNames);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: roleNames,
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
          roles: req.user.roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
          })),
          permissions: req.user.permissions,
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

export default router;
