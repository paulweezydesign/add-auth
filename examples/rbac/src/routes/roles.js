import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requirePermission } from '../middleware/rbac.js';
import pool from '../utils/db.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/roles
 * Get all roles
 */
router.get('/', requirePermission('roles:read', { matchAll: false }), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at,
              COUNT(ur.user_id)::int as user_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       GROUP BY r.id
       ORDER BY r.name`
    );

    const roles = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: row.permissions,
      userCount: row.user_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      success: true,
      data: { roles },
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while fetching roles',
    });
  }
});

/**
 * GET /api/roles/:id
 * Get a specific role
 */
router.get('/:id', requirePermission('roles:read'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT r.id, r.name, r.description, r.permissions, r.created_at, r.updated_at,
              COUNT(ur.user_id)::int as user_count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The specified role does not exist',
      });
    }

    const row = result.rows[0];
    const role = {
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: row.permissions,
      userCount: row.user_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: 'An error occurred while fetching the role',
    });
  }
});

/**
 * POST /api/roles
 * Create a new role (Admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Role name is required',
      });
    }

    // Check if role name already exists
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existingRole.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Role exists',
        message: 'A role with this name already exists',
      });
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO roles (id, name, description, permissions)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, permissions, created_at`,
      [id, name, description, JSON.stringify(permissions)]
    );

    const role = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          createdAt: role.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      error: 'Creation failed',
      message: 'An error occurred while creating the role',
    });
  }
});

/**
 * PUT /api/roles/:id
 * Update a role (Admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role exists
    const existingRole = await pool.query(
      'SELECT id, name FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The specified role does not exist',
      });
    }

    // Prevent modifying the admin role name
    if (existingRole.rows[0].name === 'admin' && name && name !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify',
        message: 'The admin role name cannot be changed',
      });
    }

    // Check for name conflict if changing name
    if (name && name !== existingRole.rows[0].name) {
      const nameConflict = await pool.query(
        'SELECT id FROM roles WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name, id]
      );

      if (nameConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Name conflict',
          message: 'A role with this name already exists',
        });
      }
    }

    const result = await pool.query(
      `UPDATE roles 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           permissions = COALESCE($3, permissions),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, description, permissions, created_at, updated_at`,
      [name, description, permissions ? JSON.stringify(permissions) : null, id]
    );

    const role = result.rows[0];

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          createdAt: role.created_at,
          updatedAt: role.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: 'An error occurred while updating the role',
    });
  }
});

/**
 * DELETE /api/roles/:id
 * Delete a role (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const existingRole = await pool.query(
      'SELECT id, name FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The specified role does not exist',
      });
    }

    // Prevent deleting protected roles
    const protectedRoles = ['admin', 'user'];
    if (protectedRoles.includes(existingRole.rows[0].name)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete',
        message: 'This role is protected and cannot be deleted',
      });
    }

    // Remove role from all users first
    await pool.query('DELETE FROM user_roles WHERE role_id = $1', [id]);

    // Delete the role
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      error: 'Deletion failed',
      message: 'An error occurred while deleting the role',
    });
  }
});

/**
 * POST /api/roles/assign
 * Assign a role to a user (Admin only)
 */
router.post('/assign', requireAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'User ID and Role ID are required',
      });
    }

    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    // Check if role exists
    const roleExists = await pool.query('SELECT id, name FROM roles WHERE id = $1', [roleId]);
    if (roleExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
        message: 'The specified role does not exist',
      });
    }

    // Assign role
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId, req.user.userId]
    );

    res.json({
      success: true,
      message: `Role '${roleExists.rows[0].name}' assigned to user successfully`,
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      error: 'Assignment failed',
      message: 'An error occurred while assigning the role',
    });
  }
});

/**
 * DELETE /api/roles/assign/:userId/:roleId
 * Remove a role from a user (Admin only)
 */
router.delete('/assign/:userId/:roleId', requireAdmin, async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    // Check if assignment exists
    const assignment = await pool.query(
      `SELECT ur.*, r.name as role_name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.role_id = $2`,
      [userId, roleId]
    );

    if (assignment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
        message: 'This role is not assigned to the user',
      });
    }

    // Remove assignment
    await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );

    res.json({
      success: true,
      message: `Role '${assignment.rows[0].role_name}' removed from user successfully`,
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({
      success: false,
      error: 'Removal failed',
      message: 'An error occurred while removing the role',
    });
  }
});

export default router;
