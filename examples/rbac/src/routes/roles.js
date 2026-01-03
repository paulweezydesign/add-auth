const express = require('express');
const pool = require('../utils/db');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// Admin-only role management endpoints
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Validation failed', message: 'Role name is required' });

    const perms = Array.isArray(permissions) ? permissions : [];
    const created = await pool.query(
      `INSERT INTO roles (name, description, permissions)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, permissions = EXCLUDED.permissions
       RETURNING id, name, description, permissions, created_at`,
      [name, description || null, JSON.stringify(perms)]
    );

    res.status(201).json({ success: true, data: { role: created.rows[0] } });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to create role' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description, permissions, created_at FROM roles ORDER BY name ASC');
    res.json({ success: true, data: { roles: result.rows } });
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to list roles' });
  }
});

router.put('/:roleId', requireRole('admin'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { description, permissions } = req.body;
    const perms = Array.isArray(permissions) ? permissions : undefined;

    const result = await pool.query(
      `UPDATE roles
       SET description = COALESCE($2, description),
           permissions = COALESCE($3, permissions)
       WHERE id = $1
       RETURNING id, name, description, permissions, updated_at`,
      [roleId, description || null, perms ? JSON.stringify(perms) : null]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found', message: 'Role not found' });
    res.json({ success: true, data: { role: result.rows[0] } });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to update role' });
  }
});

router.delete('/:roleId', requireRole('admin'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const result = await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Not found', message: 'Role not found' });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to delete role' });
  }
});

router.post('/assign', requireRole('admin'), async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'userId and roleId are required' });
    }

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [userId, roleId, req.user.userId]
    );

    res.status(200).json({ success: true, message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to assign role' });
  }
});

router.delete('/assign/:userId/:roleId', requireRole('admin'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    await pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, roleId]);
    res.json({ success: true, message: 'Role unassigned successfully' });
  } catch (error) {
    console.error('Unassign role error:', error);
    res.status(500).json({ success: false, error: 'Request failed', message: 'Failed to unassign role' });
  }
});

module.exports = router;

