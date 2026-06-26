import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { enforceTokenBlacklist } from '../utils/tokenBlacklist';
import { JWTPayload, TokenBlacklistedError } from '../types/jwt';
import { AuthContext } from '../types/auth-context';
import '../types/auth-context';
import { SessionService } from '../services/sessionService';
import { RoleModel } from '../models/Role';
import { logger } from '../utils/logger';

export interface AuthenticateOptions {
  optional?: boolean;
  requireSession?: boolean;
}

async function buildAuthContext(
  payload: JWTPayload,
  req: Request
): Promise<AuthContext> {
  const roles = await RoleModel.getUserRoles(payload.id);
  const roleNames = roles.map((role) => role.name);
  const permissions = await RoleModel.getUserPermissions(payload.id);

  let trustScore: number | undefined;
  if (payload.sessionId) {
    const validation = await SessionService.validateSession(payload.sessionId, req);
    if (validation.session) {
      trustScore = validation.session.trust_score;
    }
  }

  return {
    userId: payload.id,
    email: payload.email,
    sessionId: payload.sessionId,
    roles: roleNames.length > 0 ? roleNames : payload.roles || [],
    permissions,
    trustScore,
    authMethod: 'jwt',
  };
}

/**
 * Unified authentication middleware for JWT-backed API routes.
 */
export function authenticate(options: AuthenticateOptions = {}) {
  const { optional = false, requireSession = false } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        if (optional) {
          next();
          return;
        }

        res.status(401).json({
          error: 'Authentication required',
          message: 'No token provided',
          code: 'AUTHENTICATION_REQUIRED',
        });
        return;
      }

      try {
        await enforceTokenBlacklist(token);
      } catch (error) {
        if (error instanceof TokenBlacklistedError) {
          res.status(401).json({
            error: 'Token invalid',
            message: 'Token has been revoked',
            code: 'TOKEN_BLACKLISTED',
          });
          return;
        }
        throw error;
      }

      const payload = verifyToken(token);

      if (requireSession) {
        if (!payload.sessionId) {
          res.status(401).json({
            error: 'Authentication required',
            message: 'No linked session found for this token',
            code: 'SESSION_REQUIRED',
          });
          return;
        }

        const validation = await SessionService.validateSession(payload.sessionId, req);
        if (!validation.isValid || !validation.session?.is_active) {
          res.status(401).json({
            error: 'Session invalid',
            message: validation.reason || 'Session is no longer active',
            code: 'SESSION_INVALID',
          });
          return;
        }

        req.redisSession = validation.session;
      } else if (payload.sessionId) {
        const validation = await SessionService.validateSession(payload.sessionId, req);
        if (validation.session?.is_active) {
          req.redisSession = validation.session;
        }
      }

      req.user = payload;
      req.auth = await buildAuthContext(payload, req);

      logger.debug('Request authenticated', {
        userId: req.auth.userId,
        sessionId: req.auth.sessionId,
      });

      next();
    } catch (error: any) {
      if (optional) {
        next();
        return;
      }

      logger.error('Authentication error:', error);

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          error: 'Token expired',
          message: 'Please refresh your token',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      if (error.name === 'TokenInvalidError') {
        res.status(401).json({
          error: 'Invalid token',
          message: 'Token is malformed or invalid',
          code: 'TOKEN_INVALID',
        });
        return;
      }

      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid token',
        code: 'AUTHENTICATION_FAILED',
      });
    }
  };
}

/**
 * Optional authentication middleware.
 */
export const optionalAuth = authenticate({ optional: true });
export const optionalAuthenticate = optionalAuth;

/**
 * Backward-compatible alias for existing JWT middleware.
 */
export const authenticateToken = authenticate();
