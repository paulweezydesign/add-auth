/**
 * Refresh Token Management
 *
 * Secure refresh token generation, validation, and rotation backed by TokenStore.
 */

import {
  UserPayload,
  TokenPair,
  RefreshTokenData,
  TokenValidationResult,
  JWTError,
  TokenInvalidError
} from '../types/jwt';
import {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken as validateRefreshTokenJWT,
  getTokenId,
  getRefreshTokenTtlMs,
  TokenGenerationOptions,
} from './jwt';
import { TokenStore } from '../services/tokenStore';

export interface RefreshTokenMetadata extends TokenGenerationOptions {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generates a new refresh token and stores its metadata
 */
export async function createRefreshToken(
  payload: UserPayload,
  metadata?: RefreshTokenMetadata
): Promise<string> {
  try {
    const refreshToken = await generateRefreshToken(payload, {
      sessionId: metadata?.sessionId,
    });
    const tokenId = getTokenId(refreshToken);

    if (!tokenId) {
      throw new JWTError('Failed to generate token ID', 'TOKEN_ID_GENERATION_FAILED', 500);
    }

    const refreshTokenData: RefreshTokenData = {
      userId: payload.id,
      tokenId,
      sessionId: metadata?.sessionId,
      expiresAt: new Date(Date.now() + getRefreshTokenTtlMs()),
      createdAt: new Date(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    };

    await TokenStore.storeRefreshToken(tokenId, refreshTokenData);

    return refreshToken;
  } catch (error) {
    throw new JWTError(
      `Refresh token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'REFRESH_TOKEN_CREATION_FAILED',
      500
    );
  }
}

/**
 * Validates a refresh token and checks if it's been revoked
 */
export async function validateRefreshToken(token: string): Promise<TokenValidationResult> {
  try {
    const jwtValidation = await validateRefreshTokenJWT(token);

    if (!jwtValidation.valid) {
      return jwtValidation;
    }

    const tokenId = getTokenId(token);
    if (!tokenId) {
      return {
        valid: false,
        error: 'Token ID not found',
      };
    }

    const tokenData = await TokenStore.getRefreshToken(tokenId);
    if (!tokenData) {
      return {
        valid: false,
        error: 'Refresh token not found or has been revoked',
      };
    }

    if (tokenData.revokedAt) {
      return {
        valid: false,
        error: 'Refresh token has been revoked',
      };
    }

    if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
      await TokenStore.deleteRefreshToken(tokenId);
      return {
        valid: false,
        error: 'Refresh token has expired',
        expired: true,
      };
    }

    return jwtValidation;
  } catch (error) {
    return {
      valid: false,
      error: `Refresh token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Refreshes an access token using a valid refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  rotateRefreshToken: boolean = true
): Promise<TokenPair> {
  try {
    const validation = await validateRefreshToken(refreshToken);

    if (!validation.valid || !validation.payload) {
      throw new TokenInvalidError('Invalid refresh token');
    }

    const userPayload: UserPayload = {
      id: validation.payload.id,
      email: validation.payload.email,
      roles: validation.payload.roles,
    };

    const sessionId = validation.payload.sessionId;
    const tokenOptions: TokenGenerationOptions = sessionId ? { sessionId } : {};

    const newAccessToken = await generateAccessToken(userPayload, tokenOptions);

    let newRefreshToken = refreshToken;

    if (rotateRefreshToken) {
      const metadata = await getRefreshTokenMetadata(refreshToken);
      await revokeRefreshToken(refreshToken);

      newRefreshToken = await createRefreshToken(userPayload, {
        sessionId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
    }

    const expiresIn = 15 * 60;

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (error) {
    if (error instanceof JWTError) {
      throw error;
    }
    throw new JWTError(
      `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'TOKEN_REFRESH_FAILED',
      401
    );
  }
}

/**
 * Revokes a refresh token
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const tokenId = getTokenId(token);
    if (!tokenId) {
      return false;
    }

    return TokenStore.revokeRefreshToken(tokenId);
  } catch (error) {
    return false;
  }
}

/**
 * Revokes all refresh tokens for a specific user
 */
export async function revokeAllUserRefreshTokens(userId: string): Promise<number> {
  return TokenStore.revokeAllUserRefreshTokens(userId);
}

/**
 * Gets refresh token metadata
 */
export async function getRefreshTokenMetadata(token: string): Promise<RefreshTokenData | null> {
  const tokenId = getTokenId(token);
  if (!tokenId) {
    return null;
  }

  return TokenStore.getRefreshToken(tokenId);
}

/**
 * Cleans up expired refresh tokens from storage
 */
export async function cleanupExpiredRefreshTokens(): Promise<number> {
  return TokenStore.cleanupExpiredRefreshTokens();
}

/**
 * Gets all refresh tokens for a user (for admin purposes)
 */
export async function getUserRefreshTokens(userId: string): Promise<RefreshTokenData[]> {
  return TokenStore.getUserRefreshTokens(userId);
}

/**
 * Validates refresh token rotation settings
 */
export async function shouldRotateRefreshToken(token: string): Promise<boolean> {
  const tokenData = await getRefreshTokenMetadata(token);
  if (!tokenData) {
    return true;
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return tokenData.createdAt < oneDayAgo;
}

/**
 * Creates a complete authentication token pair linked to a server session
 */
export async function createAuthenticationTokens(
  payload: UserPayload,
  metadata?: RefreshTokenMetadata
): Promise<TokenPair> {
  try {
    const tokenOptions: TokenGenerationOptions = metadata?.sessionId
      ? { sessionId: metadata.sessionId }
      : {};

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(payload, tokenOptions),
      createRefreshToken(payload, metadata),
    ]);

    const expiresIn = 15 * 60;

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  } catch (error) {
    throw new JWTError(
      `Authentication token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'AUTH_TOKEN_CREATION_FAILED',
      500
    );
  }
}

export function startRefreshTokenCleanup(intervalMinutes: number = 60): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const cleaned = await cleanupExpiredRefreshTokens();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired refresh tokens`);
      }
    } catch (error) {
      console.error('Error during refresh token cleanup:', error);
    }
  }, intervalMinutes * 60 * 1000);
}
