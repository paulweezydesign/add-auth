/**
 * Redis-backed token store for refresh tokens and access-token blacklist.
 * Falls back to in-memory storage when Redis is unavailable.
 */

import {
  BlacklistedToken,
  RefreshTokenData,
} from '../types/jwt';
import { getRedisClient } from '../utils/redis';
import { logger } from '../utils/logger';

const REFRESH_PREFIX = 'token:refresh:';
const BLACKLIST_PREFIX = 'token:blacklist:';
const USER_REFRESH_PREFIX = 'token:user_refresh:';

class MemoryStore {
  refreshTokens = new Map<string, RefreshTokenData>();
  blacklist = new Map<string, BlacklistedToken>();
  blacklistedIds = new Set<string>();
  userRefreshIndex = new Map<string, Set<string>>();
}

const memory = new MemoryStore();

function serializeRefreshToken(data: RefreshTokenData): string {
  return JSON.stringify({
    ...data,
    expiresAt: data.expiresAt.toISOString(),
    createdAt: data.createdAt.toISOString(),
    revokedAt: data.revokedAt?.toISOString(),
  });
}

function deserializeRefreshToken(raw: string): RefreshTokenData {
  const parsed = JSON.parse(raw);
  return {
    ...parsed,
    expiresAt: new Date(parsed.expiresAt),
    createdAt: new Date(parsed.createdAt),
    revokedAt: parsed.revokedAt ? new Date(parsed.revokedAt) : undefined,
  };
}

function serializeBlacklistEntry(data: BlacklistedToken): string {
  return JSON.stringify({
    ...data,
    expiresAt: data.expiresAt.toISOString(),
    blacklistedAt: data.blacklistedAt.toISOString(),
  });
}

function deserializeBlacklistEntry(raw: string): BlacklistedToken {
  const parsed = JSON.parse(raw);
  return {
    ...parsed,
    expiresAt: new Date(parsed.expiresAt),
    blacklistedAt: new Date(parsed.blacklistedAt),
  };
}

function ttlSeconds(expiresAt: Date): number {
  const seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return Math.max(seconds, 1);
}

function trackUserRefreshToken(userId: string, tokenId: string): void {
  const existing = memory.userRefreshIndex.get(userId) ?? new Set<string>();
  existing.add(tokenId);
  memory.userRefreshIndex.set(userId, existing);
}

function untrackUserRefreshToken(userId: string, tokenId: string): void {
  const existing = memory.userRefreshIndex.get(userId);
  if (!existing) {
    return;
  }
  existing.delete(tokenId);
  if (existing.size === 0) {
    memory.userRefreshIndex.delete(userId);
  }
}

async function withRedis<T>(
  operation: (redis: ReturnType<typeof getRedisClient>) => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    const redis = getRedisClient();
    return await operation(redis);
  } catch (error) {
    logger.warn('TokenStore falling back to in-memory storage', { error });
    return await fallback();
  }
}

export class TokenStore {
  static async storeRefreshToken(
    tokenId: string,
    data: RefreshTokenData
  ): Promise<void> {
    const ttl = ttlSeconds(data.expiresAt);

    await withRedis(
      async (redis) => {
        await redis.setEx(
          `${REFRESH_PREFIX}${tokenId}`,
          ttl,
          serializeRefreshToken(data)
        );
        await redis.sAdd(`${USER_REFRESH_PREFIX}${data.userId}`, tokenId);
        await redis.expire(`${USER_REFRESH_PREFIX}${data.userId}`, ttl);
      },
      () => {
        memory.refreshTokens.set(tokenId, data);
        trackUserRefreshToken(data.userId, tokenId);
      }
    );
  }

  static async getRefreshToken(tokenId: string): Promise<RefreshTokenData | null> {
    return withRedis(
      async (redis) => {
        const raw = await redis.get(`${REFRESH_PREFIX}${tokenId}`);
        return raw ? deserializeRefreshToken(raw) : null;
      },
      () => memory.refreshTokens.get(tokenId) ?? null
    );
  }

  static async revokeRefreshToken(tokenId: string): Promise<boolean> {
    return withRedis(
      async (redis) => {
        const raw = await redis.get(`${REFRESH_PREFIX}${tokenId}`);
        if (!raw) {
          return false;
        }

        const data = deserializeRefreshToken(raw);
        data.revokedAt = new Date();
        const ttl = ttlSeconds(data.expiresAt);
        await redis.setEx(`${REFRESH_PREFIX}${tokenId}`, ttl, serializeRefreshToken(data));
        await redis.sRem(`${USER_REFRESH_PREFIX}${data.userId}`, tokenId);
        return true;
      },
      () => {
        const data = memory.refreshTokens.get(tokenId);
        if (!data) {
          return false;
        }
        data.revokedAt = new Date();
        memory.refreshTokens.set(tokenId, data);
        untrackUserRefreshToken(data.userId, tokenId);
        return true;
      }
    );
  }

  static async deleteRefreshToken(tokenId: string): Promise<void> {
    await withRedis(
      async (redis) => {
        const raw = await redis.get(`${REFRESH_PREFIX}${tokenId}`);
        if (raw) {
          const data = deserializeRefreshToken(raw);
          await redis.del(`${REFRESH_PREFIX}${tokenId}`);
          await redis.sRem(`${USER_REFRESH_PREFIX}${data.userId}`, tokenId);
        }
      },
      () => {
        const data = memory.refreshTokens.get(tokenId);
        if (data) {
          untrackUserRefreshToken(data.userId, tokenId);
        }
        memory.refreshTokens.delete(tokenId);
      }
    );
  }

  static async revokeAllUserRefreshTokens(userId: string): Promise<number> {
    return withRedis(
      async (redis) => {
        const tokenIds = await redis.sMembers(`${USER_REFRESH_PREFIX}${userId}`);
        let revokedCount = 0;

        for (const tokenId of tokenIds) {
          const revoked = await this.revokeRefreshToken(tokenId);
          if (revoked) {
            revokedCount++;
          }
        }

        await redis.del(`${USER_REFRESH_PREFIX}${userId}`);
        return revokedCount;
      },
      async () => {
        const tokenIds = memory.userRefreshIndex.get(userId);
        if (!tokenIds) {
          return 0;
        }

        let revokedCount = 0;
        for (const tokenId of tokenIds) {
          const revoked = await this.revokeRefreshToken(tokenId);
          if (revoked) {
            revokedCount++;
          }
        }

        memory.userRefreshIndex.delete(userId);
        return revokedCount;
      }
    );
  }

  static async getUserRefreshTokens(userId: string): Promise<RefreshTokenData[]> {
    return withRedis(
      async (redis) => {
        const tokenIds = await redis.sMembers(`${USER_REFRESH_PREFIX}${userId}`);
        const tokens: RefreshTokenData[] = [];

        for (const tokenId of tokenIds) {
          const token = await this.getRefreshToken(tokenId);
          if (token) {
            tokens.push(token);
          }
        }

        return tokens;
      },
      async () => {
        const tokenIds = memory.userRefreshIndex.get(userId);
        if (!tokenIds) {
          return [];
        }

        return Array.from(tokenIds)
          .map((tokenId) => memory.refreshTokens.get(tokenId))
          .filter((token): token is RefreshTokenData => Boolean(token));
      }
    );
  }

  static async addToBlacklist(
    tokenId: string,
    entry: BlacklistedToken
  ): Promise<void> {
    const ttl = ttlSeconds(entry.expiresAt);

    await withRedis(
      async (redis) => {
        await redis.setEx(
          `${BLACKLIST_PREFIX}${tokenId}`,
          ttl,
          serializeBlacklistEntry(entry)
        );
      },
      () => {
        memory.blacklist.set(tokenId, entry);
        memory.blacklistedIds.add(tokenId);
      }
    );
  }

  static async isBlacklisted(tokenId: string): Promise<boolean> {
    return withRedis(
      async (redis) => {
        const exists = await redis.exists(`${BLACKLIST_PREFIX}${tokenId}`);
        return exists === 1;
      },
      () => memory.blacklistedIds.has(tokenId)
    );
  }

  static async getBlacklistEntry(tokenId: string): Promise<BlacklistedToken | null> {
    return withRedis(
      async (redis) => {
        const raw = await redis.get(`${BLACKLIST_PREFIX}${tokenId}`);
        return raw ? deserializeBlacklistEntry(raw) : null;
      },
      () => memory.blacklist.get(tokenId) ?? null
    );
  }

  static async removeFromBlacklist(tokenId: string): Promise<boolean> {
    return withRedis(
      async (redis) => {
        const deleted = await redis.del(`${BLACKLIST_PREFIX}${tokenId}`);
        return deleted > 0;
      },
      () => {
        const removed = memory.blacklist.delete(tokenId);
        memory.blacklistedIds.delete(tokenId);
        return removed;
      }
    );
  }

  static async blacklistAllUserTokens(
    userId: string,
    reason: BlacklistedToken['reason'] = 'security'
  ): Promise<number> {
    const refreshRevoked = await this.revokeAllUserRefreshTokens(userId);

    const userTokens = await this.getUserRefreshTokens(userId);
    for (const token of userTokens) {
      if (!token.revokedAt) {
        await this.revokeRefreshToken(token.tokenId);
      }
    }

    logger.info('Blacklisted all user tokens', {
      userId,
      reason,
      refreshRevoked,
    });

    return refreshRevoked;
  }

  static async cleanupExpiredRefreshTokens(): Promise<number> {
    return withRedis(
      async () => {
        // Redis TTL handles expiry automatically.
        return 0;
      },
      () => {
        const now = new Date();
        let cleanupCount = 0;

        for (const [tokenId, tokenData] of memory.refreshTokens.entries()) {
          if (tokenData.expiresAt <= now) {
            memory.refreshTokens.delete(tokenId);
            untrackUserRefreshToken(tokenData.userId, tokenId);
            cleanupCount++;
          }
        }

        return cleanupCount;
      }
    );
  }

  static async cleanupExpiredBlacklistedTokens(): Promise<number> {
    return withRedis(
      async () => {
        return 0;
      },
      () => {
        const now = new Date();
        let cleanupCount = 0;

        for (const [tokenId, entry] of memory.blacklist.entries()) {
          if (entry.expiresAt <= now) {
            memory.blacklist.delete(tokenId);
            memory.blacklistedIds.delete(tokenId);
            cleanupCount++;
          }
        }

        return cleanupCount;
      }
    );
  }

  static async getBlacklistStats(): Promise<{
    total: number;
    expired: number;
    byReason: Record<string, number>;
  }> {
    return withRedis(
      async (redis) => {
        const keys = await redis.keys(`${BLACKLIST_PREFIX}*`);
        const byReason: Record<string, number> = {
          logout: 0,
          revoked: 0,
          security: 0,
        };
        const now = new Date();
        let expired = 0;

        for (const key of keys) {
          const raw = await redis.get(key);
          if (!raw) {
            continue;
          }
          const entry = deserializeBlacklistEntry(raw);
          if (entry.expiresAt <= now) {
            expired++;
          }
          byReason[entry.reason] = (byReason[entry.reason] ?? 0) + 1;
        }

        return {
          total: keys.length,
          expired,
          byReason,
        };
      },
      () => {
        const now = new Date();
        let expired = 0;
        const byReason: Record<string, number> = {
          logout: 0,
          revoked: 0,
          security: 0,
        };

        for (const entry of memory.blacklist.values()) {
          if (entry.expiresAt <= now) {
            expired++;
          }
          byReason[entry.reason] = (byReason[entry.reason] ?? 0) + 1;
        }

        return {
          total: memory.blacklist.size,
          expired,
          byReason,
        };
      }
    );
  }
}
