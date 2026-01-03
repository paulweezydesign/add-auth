const express = require('express');
const pool = require('../utils/db');

const router = express.Router();

function requireLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, error: 'Not authenticated' });
}

router.get('/accounts', requireLoggedIn, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT provider, provider_id, profile_data, created_at
       FROM oauth_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const accounts = result.rows.map((row) => {
      const profile = row.profile_data || {};
      return {
        provider: row.provider,
        providerId: row.provider_id,
        email: profile.email,
        displayName: profile.displayName,
        createdAt: row.created_at
      };
    });

    res.json({ success: true, data: { accounts } });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to list OAuth accounts' });
  }
});

router.delete('/unlink/:provider', requireLoggedIn, async (req, res) => {
  try {
    const { provider } = req.params;

    // Prevent unlinking the last OAuth account if user has no password (avoid lockout)
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const hasPassword = !!userResult.rows[0]?.password_hash;

    const accountsResult = await pool.query('SELECT COUNT(*)::int AS cnt FROM oauth_accounts WHERE user_id = $1', [req.user.id]);
    const accountCount = accountsResult.rows[0]?.cnt || 0;
    if (!hasPassword && accountCount <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot unlink last account',
        message: 'Set a password before unlinking your last OAuth account.'
      });
    }

    const del = await pool.query('DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2', [req.user.id, provider]);
    if (del.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Not found', message: 'OAuth account not found' });
    }

    // Recompute oauth_providers
    await pool.query(
      `UPDATE users
       SET oauth_providers = (
         SELECT COALESCE(jsonb_agg(provider), '[]'::jsonb)
         FROM (
           SELECT DISTINCT provider
           FROM oauth_accounts
           WHERE user_id = $1
         ) sub
       )
       WHERE id = $1`,
      [req.user.id]
    );

    res.json({ success: true, message: 'OAuth account unlinked successfully' });
  } catch (error) {
    console.error('Unlink error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to unlink OAuth account' });
  }
});

module.exports = router;

