/**
 * Token Blacklisting System
 *
 * Logout, token revocation, and security incident response backed by TokenStore.
 */

import {
  BlacklistedToken,
  TokenValidationResult,
  JWTError,
  TokenBlacklistedError,
} from '../types/jwt';
import {
  getTokenId,
  getUserIdFromToken,
  getTokenMetadata,
} from './jwt';
import { TokenStore } from '../services/tokenStore';
import { revokeRefreshToken } from './refreshToken';

/**
 * Adds a token to the blacklist
 */
export async function addToBlacklist(
  token: string,
  reason: 'logout' | 'revoked' | 'security',
  userId?: string
): Promise<boolean> {
  try {
    const tokenId = getTokenId(token);
    if (!tokenId) {
      throw new JWTError('Invalid token: cannot extract token ID', 'INVALID_TOKEN_ID', 400);
    }

    const extractedUserId = userId || getUserIdFromToken(token);
    if (!extractedUserId) {
      throw new JWTError('Invalid token: cannot extract user ID', 'INVALID_USER_ID', 400);
    }

    const metadata = getTokenMetadata(token);
    if (!metadata) {
      throw new JWTError('Invalid token: cannot extract metadata', 'INVALID_TOKEN_METADATA', 400);
    }

    const blacklistedToken: BlacklistedToken = {
      tokenId,
      userId: extractedUserId,
      expiresAt: metadata.expiresAt,
      blacklistedAt: new Date(),
      reason,
    };

    await TokenStore.addToBlacklist(tokenId, blacklistedToken);
    return true;
  } catch (error) {
    console.error('Error adding token to blacklist:', error);
    return false;
  }
}

/**
 * Checks if a token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const tokenId = getTokenId(token);
    if (!tokenId) {
      return false;
    }

    return TokenStore.isBlacklisted(tokenId);
  } catch (error) {
    console.error('Error checking token blacklist status:', error);
    return false;
  }
}

/**
 * Validates that a token is not blacklisted
 */
export async function validateTokenNotBlacklisted(token: string): Promise<TokenValidationResult> {
  try {
    const isBlacklisted = await isTokenBlacklisted(token);

    if (isBlacklisted) {
      const tokenId = getTokenId(token);
      const blacklistEntry = tokenId ? await TokenStore.getBlacklistEntry(tokenId) : null;

      return {
        valid: false,
        error: `Token has been blacklisted (reason: ${blacklistEntry?.reason || 'unknown'})`,
      };
    }

    return {
      valid: true,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Blacklist validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Removes a token from the blacklist (for administrative purposes)
 */
export async function removeFromBlacklist(token: string): Promise<boolean> {
  try {
    const tokenId = getTokenId(token);
    if (!tokenId) {
      return false;
    }

    return TokenStore.removeFromBlacklist(tokenId);
  } catch (error) {
    console.error('Error removing token from blacklist:', error);
    return false;
  }
}

/**
 * Blacklists all tokens for a specific user
 */
export async function blacklistAllUserTokens(
  userId: string,
  reason: 'logout' | 'revoked' | 'security' = 'security'
): Promise<number> {
  const refreshRevoked = await revokeAllUserRefreshTokens(userId);
  await TokenStore.blacklistAllUserTokens(userId, reason);
  return refreshRevoked;
}

/**
 * Gets blacklist information for a token
 */
export async function getBlacklistInfo(token: string): Promise<BlacklistedToken | null> {
  try {
    const tokenId = getTokenId(token);
    if (!tokenId) {
      return null;
    }

    return TokenStore.getBlacklistEntry(tokenId);
  } catch (error) {
    console.error('Error getting blacklist info:', error);
    return null;
  }
}

/**
 * Cleans up expired tokens from the blacklist
 */
export async function cleanupExpiredBlacklistedTokens(): Promise<number> {
  return TokenStore.cleanupExpiredBlacklistedTokens();
}

/**
 * Gets all blacklisted tokens for a user
 */
export async function getUserBlacklistedTokens(userId: string): Promise<BlacklistedToken[]> {
  const userRefreshTokens = await TokenStore.getUserRefreshTokens(userId);
  const blacklistedTokens: BlacklistedToken[] = [];

  for (const refreshToken of userRefreshTokens) {
    const entry = await TokenStore.getBlacklistEntry(refreshToken.tokenId);
    if (entry) {
      blacklistedTokens.push(entry);
    }
  }

  return blacklistedTokens;
}

/**
 * Gets blacklist statistics
 */
export async function getBlacklistStats(): Promise<{
  total: number;
  expired: number;
  byReason: Record<string, number>;
}> {
  return TokenStore.getBlacklistStats();
}

/**
 * Performs a logout operation by blacklisting the token
 */
export async function performLogout(
  token: string,
  refreshToken?: string
): Promise<boolean> {
  try {
    let success = true;

    const accessTokenBlacklisted = await addToBlacklist(token, 'logout');
    if (!accessTokenBlacklisted) {
      success = false;
    }

    if (refreshToken) {
      const refreshTokenBlacklisted = await addToBlacklist(refreshToken, 'logout');
      const refreshRevoked = await revokeRefreshToken(refreshToken);
      if (!refreshTokenBlacklisted && !refreshRevoked) {
        success = false;
      }
    }

    return success;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
}

/**
 * Performs a security revocation by blacklisting all user tokens
 */
export async function performSecurityRevocation(
  userId: string,
  tokens: string[] = []
): Promise<{ success: boolean; blacklistedCount: number }> {
  let blacklistedCount = 0;
  let success = true;

  try {
    for (const token of tokens) {
      const blacklisted = await addToBlacklist(token, 'security', userId);
      if (blacklisted) {
        blacklistedCount++;
      } else {
        success = false;
      }
    }

    if (tokens.length === 0) {
      blacklistedCount = await blacklistAllUserTokens(userId, 'security');
    }

    return { success, blacklistedCount };
  } catch (error) {
    console.error('Error during security revocation:', error);
    return { success: false, blacklistedCount };
  }
}

/**
 * Middleware function to check token blacklist status
 */
export async function enforceTokenBlacklist(token: string): Promise<void> {
  const isBlacklisted = await isTokenBlacklisted(token);

  if (isBlacklisted) {
    const blacklistInfo = await getBlacklistInfo(token);
    throw new TokenBlacklistedError(
      `Token has been blacklisted (reason: ${blacklistInfo?.reason || 'unknown'})`
    );
  }
}

export function startBlacklistCleanup(intervalMinutes: number = 60): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const cleaned = await cleanupExpiredBlacklistedTokens();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired blacklisted tokens`);
      }
    } catch (error) {
      console.error('Error during blacklist cleanup:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

export function initializeBlacklistSystem(options?: {
  cleanupInterval?: number;
  autoCleanup?: boolean;
}): NodeJS.Timeout | null {
  const { cleanupInterval = 60, autoCleanup = true } = options || {};

  console.log('Initializing token blacklist system...');

  if (autoCleanup) {
    return startBlacklistCleanup(cleanupInterval);
  }

  return null;
}
