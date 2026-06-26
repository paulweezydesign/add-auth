import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RoleModel } from '../models/Role';
import { logger } from '../utils/logger';
import { authenticate } from './authenticate';

export interface AuthorizeOptions {
  roles?: string[];
  permissions?: string[];
  requireAll?: boolean;
  onUnauthorized?: (req: Request, res: Response) => void;
}

declare global {
  namespace Express {
    interface Request {
      userRoles?: string[];
      userPermissions?: string[];
    }
  }
}

export type RBACOptions = AuthorizeOptions;

function handleUnauthorized(
  req: Request,
  res: Response,
  message: string,
  onUnauthorized?: (req: Request, res: Response) => void
): void {
  if (onUnauthorized) {
    onUnauthorized(req, res);
    return;
  }

  res.status(403).json({
    error: 'Forbidden',
    message,
    code: 'INSUFFICIENT_PERMISSIONS',
  });
}

function chainMiddleware(...handlers: RequestHandler[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = 0;

    const runNext = (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }

      const handler = handlers[index++];
      if (!handler) {
        next();
        return;
      }

      handler(req, res, runNext);
    };

    runNext();
  };
}

async function ensureAuthContext(req: Request): Promise<boolean> {
  if (req.auth?.userId) {
    req.userRoles = req.auth.roles;
    req.userPermissions = req.auth.permissions;
    return true;
  }

  if (!req.user?.id) {
    return false;
  }

  const roles = await RoleModel.getUserRoles(req.user.id);
  const permissions = await RoleModel.getUserPermissions(req.user.id);

  req.auth = {
    userId: req.user.id,
    email: req.user.email,
    sessionId: req.user.sessionId,
    roles: roles.map((role) => role.name),
    permissions,
    authMethod: 'jwt',
  };

  req.userRoles = req.auth.roles;
  req.userPermissions = req.auth.permissions;

  return true;
}

function createAuthorizeMiddleware(options: AuthorizeOptions = {}): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasContext = await ensureAuthContext(req);
      if (!hasContext) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const userId = req.auth!.userId;
      const userRoles = req.auth!.roles;
      const userPermissions = req.auth!.permissions;
      const requireAll = options.requireAll || false;

      if (options.roles?.length) {
        const hasRequiredRole = requireAll
          ? options.roles.every((role) => userRoles.includes(role))
          : options.roles.some((role) => userRoles.includes(role));

        if (!hasRequiredRole) {
          logger.warn('Access denied - insufficient roles', {
            userId,
            userRoles,
            requiredRoles: options.roles,
            path: req.path,
          });

          handleUnauthorized(
            req,
            res,
            'Insufficient permissions - required roles not found',
            options.onUnauthorized
          );
          return;
        }
      }

      if (options.permissions?.length) {
        const hasRequiredPermission = requireAll
          ? options.permissions.every((permission) => userPermissions.includes(permission))
          : options.permissions.some((permission) => userPermissions.includes(permission));

        if (!hasRequiredPermission) {
          logger.warn('Access denied - insufficient permissions', {
            userId,
            userPermissions,
            requiredPermissions: options.permissions,
            path: req.path,
          });

          handleUnauthorized(
            req,
            res,
            'Insufficient permissions - required permissions not found',
            options.onUnauthorized
          );
          return;
        }
      }

      next();
    } catch (error) {
      logger.error('Authorization error', { error, path: req.path });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Authorization check failed',
        code: 'AUTHORIZATION_ERROR',
      });
    }
  };
}

/**
 * Unified authorization middleware backed by database roles and permissions.
 */
export function authorize(options: AuthorizeOptions = {}): RequestHandler {
  return chainMiddleware(authenticate(), createAuthorizeMiddleware(options));
}

export const requireAuth = authenticate();

export function requireRole(roles: string | string[], options: Partial<AuthorizeOptions> = {}) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return authorize({ ...options, roles: requiredRoles });
}

export function requirePermission(
  permissions: string | string[],
  options: Partial<AuthorizeOptions> = {}
) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return authorize({ ...options, permissions: requiredPermissions });
}

export function requireRoleOrPermission(
  roles: string | string[],
  permissions: string | string[],
  options: Partial<AuthorizeOptions> = {}
) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return chainMiddleware(authenticate(), async (req, res, next) => {
    try {
      const hasContext = await ensureAuthContext(req);
      if (!hasContext) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const userRoles = req.auth!.roles;
      const userPermissions = req.auth!.permissions;
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasRole && !hasPermission) {
        handleUnauthorized(
          req,
          res,
          'Insufficient permissions - required roles or permissions not found',
          options.onUnauthorized
        );
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  });
}

export function requireOwnership(resourceUserIdField: string = 'user_id') {
  return chainMiddleware(authenticate(), async (req, res, next) => {
    try {
      const hasContext = await ensureAuthContext(req);
      if (!hasContext) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      const isAdmin = req.auth!.roles.includes('admin');

      if (!resourceUserId) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Resource user ID not found',
          code: 'RESOURCE_USER_ID_MISSING',
        });
        return;
      }

      if (req.auth!.userId !== resourceUserId && !isAdmin) {
        handleUnauthorized(req, res, 'You can only access your own resources');
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  });
}

export const requireAdmin = requireRole('admin');
export const requireModerator = requireRole(['admin', 'moderator']);

export function requireTrustScore(minimumScore: number = 0.5) {
  return chainMiddleware(authenticate({ requireSession: true }), (req, res, next) => {
    const trustScore = req.redisSession?.trust_score ?? req.auth?.trustScore ?? 0;

    if (trustScore < minimumScore) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Additional security verification required',
        code: 'INSUFFICIENT_TRUST_SCORE',
      });
      return;
    }

    next();
  });
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    return await RoleModel.hasPermission(userId, permission);
  } catch (error) {
    logger.error('Error checking permission', { userId, permission, error });
    return false;
  }
}

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const roles = await RoleModel.getUserRoles(userId);
    return roles.map((role) => role.name);
  } catch (error) {
    logger.error('Error getting user roles', { userId, error });
    return [];
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    return await RoleModel.getUserPermissions(userId);
  } catch (error) {
    logger.error('Error getting user permissions', { userId, error });
    return [];
  }
}

export default {
  requireAuth,
  requireRole,
  requirePermission,
  requireRoleOrPermission,
  requireOwnership,
  requireAdmin,
  requireModerator,
  requireTrustScore,
  hasPermission,
  getUserRoles,
  getUserPermissions,
};
