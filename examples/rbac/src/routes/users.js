const express = require('express');
const pool = require('../utils/db');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// Admin-only: list roles for a user
router.get('/:userId/roles', requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.name, r.description, r.permissions, ur.assigned_at, ur.assigned_by
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY r.name ASC`,
      [userId]
    );
    res.json({ success: true, data: { roles: result.rows } });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to get user roles' });
  }
});

module.exports = router;

