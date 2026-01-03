import { hasPermission, hasAllPermissions, hasAnyPermission } from '../utils/permissions.js';

/**
 * Middleware to require specific permission(s)
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @param {object} options - Options for permission checking
 * @param {boolean} options.matchAll - If true, all permissions required (AND); if false, any permission (OR)
 */
export const requirePermission = (requiredPermissions, options = { matchAll: true }) => {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return (req, res, next) => {
    if (!req.user?.permissions) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required',
      });
    }

    const hasAccess = options.matchAll
      ? hasAllPermissions(req.user.permissions, permissions)
      : hasAnyPermission(req.user.permissions, permissions);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `Missing required permission(s): ${permissions.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware to require specific role(s)
 * @param {string|string[]} requiredRoles - Role(s) required (OR logic)
 */
export const requireRole = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    if (!req.user?.roles) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required',
      });
    }

    const userRoleNames = req.user.roles.map((r) => r.name.toLowerCase());
    const hasRole = roles.some((r) => userRoleNames.includes(r.toLowerCase()));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `Required role(s): ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('admin');
