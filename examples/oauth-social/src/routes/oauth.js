import express from 'express';
import pool from '../utils/db.js';

const router = express.Router();

/**
 * Middleware to ensure user is authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    error: 'Not authenticated',
    message: 'Please login to access this resource',
  });
};

/**
 * GET /api/oauth/accounts
 * Get all OAuth accounts linked to current user
 */
router.get('/accounts', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT provider, provider_id, email, display_name, avatar_url, created_at
       FROM oauth_accounts WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    const accounts = result.rows.map((row) => ({
      provider: row.provider,
      providerId: row.provider_id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      data: {
        accounts,
      },
    });
  } catch (error) {
    console.error('Get OAuth accounts error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while fetching OAuth accounts',
    });
  }
});

/**
 * DELETE /api/oauth/unlink/:provider
 * Unlink an OAuth account from current user
 */
router.delete('/unlink/:provider', ensureAuthenticated, async (req, res) => {
  try {
    const { provider } = req.params;
    const validProviders = ['google', 'github'];

    if (!validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider',
        message: `Provider must be one of: ${validProviders.join(', ')}`,
      });
    }

    // Check if user has other login methods
    const accountsResult = await pool.query(
      'SELECT provider FROM oauth_accounts WHERE user_id = $1',
      [req.user.id]
    );

    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    const hasPassword = !!userResult.rows[0]?.password;
    const oauthCount = accountsResult.rows.length;

    // Prevent unlinking if it's the only login method
    if (!hasPassword && oauthCount <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot unlink',
        message: 'You must have at least one login method. Set a password or link another OAuth account first.',
      });
    }

    // Check if the OAuth account exists
    const existingResult = await pool.query(
      'SELECT id FROM oauth_accounts WHERE user_id = $1 AND provider = $2',
      [req.user.id, provider.toLowerCase()]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: `No ${provider} account is linked to your account`,
      });
    }

    // Unlink the OAuth account
    await pool.query(
      'DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2',
      [req.user.id, provider.toLowerCase()]
    );

    res.json({
      success: true,
      message: 'OAuth account unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink OAuth account error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while unlinking OAuth account',
    });
  }
});

export default router;
