import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import pool from '../utils/db.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/users/:id/roles
 * Get roles for a specific user
 */
router.get('/:id/roles', requirePermission(['users:read', 'roles:read'], { matchAll: false }), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userExists = await pool.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    const result = await pool.query(
      `SELECT r.id, r.name, r.description, r.permissions, ur.assigned_at,
              u.email as assigned_by_email
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN users u ON u.id = ur.assigned_by
       WHERE ur.user_id = $1
       ORDER BY r.name`,
      [id]
    );

    const roles = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: row.permissions,
      assignedAt: row.assigned_at,
      assignedBy: row.assigned_by_email,
    }));

    res.json({
      success: true,
      data: {
        user: {
          id: userExists.rows[0].id,
          email: userExists.rows[0].email,
          username: userExists.rows[0].username,
        },
        roles,
      },
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while fetching user roles',
    });
  }
});

export default router;
