import pool from './db.js';

/**
 * Get all permissions for a user from their roles
 */
export const getUserPermissions = async (userId) => {
  const result = await pool.query(
    `SELECT DISTINCT r.permissions
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );

  const permissions = new Set();
  for (const row of result.rows) {
    if (Array.isArray(row.permissions)) {
      row.permissions.forEach((p) => permissions.add(p));
    }
  }

  return Array.from(permissions);
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (userPermissions, requiredPermission) => {
  // Check for wildcard admin permission
  if (userPermissions.includes('*:*')) {
    return true;
  }

  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for resource wildcard (e.g., 'users:*' matches 'users:read')
  const [resource, action] = requiredPermission.split(':');
  if (userPermissions.includes(`${resource}:*`)) {
    return true;
  }

  // Check for action wildcard (e.g., '*:read' matches 'users:read')
  if (userPermissions.includes(`*:${action}`)) {
    return true;
  }

  return false;
};

/**
 * Check if user has all required permissions
 */
export const hasAllPermissions = (userPermissions, requiredPermissions) =>
  requiredPermissions.every((p) => hasPermission(userPermissions, p));

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (userPermissions, requiredPermissions) =>
  requiredPermissions.some((p) => hasPermission(userPermissions, p));

/**
 * Get user's roles
 */
export const getUserRoles = async (userId) => {
  const result = await pool.query(
    `SELECT r.id, r.name, r.description, r.permissions
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );

  return result.rows;
};

/**
 * Check if user has a specific role
 */
export const hasRole = async (userId, roleName) => {
  const roles = await getUserRoles(userId);
  return roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());
};
