const pool = require('../utils/db');

async function loadUserPermissions(userId) {
  const result = await pool.query(
    `SELECT r.name, r.permissions
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );

  const roles = result.rows.map(r => r.name);
  const permissions = new Set();
  for (const row of result.rows) {
    const perms = row.permissions || [];
    for (const p of perms) permissions.add(p);
  }
  return { roles, permissions: Array.from(permissions) };
}

function requireRole(required) {
  const requiredRoles = Array.isArray(required) ? required : [required];

  return async (req, res, next) => {
    try {
      const { roles } = await loadUserPermissions(req.user.userId);
      const ok = requiredRoles.some(r => roles.includes(r));
      if (!ok) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'Insufficient role' });
      }
      next();
    } catch (error) {
      console.error('RBAC role check error:', error);
      res.status(500).json({ success: false, error: 'Authorization error' });
    }
  };
}

function requirePermission(required) {
  const requiredPerms = Array.isArray(required) ? required : [required];

  return async (req, res, next) => {
    try {
      const { permissions } = await loadUserPermissions(req.user.userId);
      const permSet = new Set(permissions);
      const ok = requiredPerms.every(p => permSet.has(p));
      if (!ok) {
        return res.status(403).json({ success: false, error: 'Access denied', message: 'Missing permission' });
      }
      next();
    } catch (error) {
      console.error('RBAC permission check error:', error);
      res.status(500).json({ success: false, error: 'Authorization error' });
    }
  };
}

module.exports = { loadUserPermissions, requireRole, requirePermission };

