import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from '../config';
import { logger } from './logger';
import {
  UserPayload,
  JWTPayload,
  TokenValidationResult,
  TokenExpiredError,
  TokenInvalidError,
  JWTError
} from '../types/jwt';

export interface TokenGenerationOptions {
  sessionId?: string;
}

function buildJwtPayload(
  payload: UserPayload,
  options?: TokenGenerationOptions
): JWTPayload {
  return {
    ...payload,
    sessionId: options?.sessionId,
    jti: uuidv4(),
  };
}

/**
 * Generate a JWT access token
 */
export async function generateAccessToken(
  payload: UserPayload,
  options?: TokenGenerationOptions
): Promise<string> {
  try {
    const jwtPayload = buildJwtPayload(payload, options);

    return jwt.sign(jwtPayload as jwt.JwtPayload, appConfig.security.jwtSecret, {
      expiresIn: appConfig.security.jwtExpiresIn,
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new JWTError('Failed to generate access token', 'TOKEN_GENERATION_FAILED', 500);
  }
}

/**
 * Generate a JWT refresh token
 */
export async function generateRefreshToken(
  payload: UserPayload,
  options?: TokenGenerationOptions
): Promise<string> {
  try {
    const jwtPayload = buildJwtPayload(payload, options);

    return jwt.sign(jwtPayload as jwt.JwtPayload, appConfig.security.jwtSecret, {
      expiresIn: appConfig.security.jwtRefreshExpiresIn,
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new JWTError('Failed to generate refresh token', 'REFRESH_TOKEN_GENERATION_FAILED', 500);
  }
}

/**
 * Validate an access token
 */
export async function validateAccessToken(token: string): Promise<TokenValidationResult> {
  try {
    const decoded = jwt.verify(token, appConfig.security.jwtSecret) as JWTPayload;
    
    return {
      valid: true,
      payload: decoded
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token has expired',
        expired: true
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token'
      };
    } else {
      logger.error('Error validating access token:', error);
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }
}

/**
 * Validate a refresh token
 */
export async function validateRefreshToken(token: string): Promise<TokenValidationResult> {
  try {
    const decoded = jwt.verify(token, appConfig.security.jwtSecret) as JWTPayload;
    
    return {
      valid: true,
      payload: decoded
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Refresh token has expired',
        expired: true
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid refresh token'
      };
    } else {
      logger.error('Error validating refresh token:', error);
      return {
        valid: false,
        error: 'Refresh token validation failed'
      };
    }
  }
}

/**
 * Get unique token ID from JWT (jti claim, with legacy sessionId fallback)
 */
export function getTokenId(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.jti || decoded?.sessionId || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get linked session ID from JWT
 */
export function getSessionIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.sessionId || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user ID from JWT
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get token metadata (expiration, etc.)
 */
export function getTokenMetadata(token: string): { expiresAt: Date; issuedAt: Date } | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded?.exp || !decoded?.iat) {
      return null;
    }

    return {
      expiresAt: new Date(decoded.exp * 1000),
      issuedAt: new Date(decoded.iat * 1000)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded?.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

/**
 * Verify token and extract payload
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, appConfig.security.jwtSecret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenInvalidError('Invalid token');
    } else {
      logger.error('Error verifying token:', error);
      throw new JWTError('Token verification failed', 'TOKEN_VERIFICATION_FAILED', 500);
    }
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Parse refresh token TTL from config (defaults to 7 days)
 */
export function getRefreshTokenTtlMs(): number {
  const value = appConfig.security.jwtRefreshExpiresIn;
  const match = /^(\d+)([dhms])$/.exec(value);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 's':
      return amount * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}
