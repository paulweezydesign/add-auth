/**
 * Rate Limiting Middleware
 * Implements Redis-based rate limiting for API endpoints
 */

import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { appConfig } from '../config';

// Redis client configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Redis connection event handlers
redisClient.on('connect', () => {
  logger.info('Redis connected for rate limiting');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('close', () => {
  logger.warn('Redis connection closed');
});

/**
 * Rate limiter configurations for different endpoints
 */
export const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req: Request) => {
      // Use IP address as key, with fallback to connection info
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '15 minutes'
      });
    }
  }),

  // Authentication endpoints (more restrictive)
  auth: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth attempts per windowMs
    message: {
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return `auth:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again later.',
        retryAfter: '15 minutes'
      });
    }
  }),

  // Password reset endpoints (very restrictive)
  passwordReset: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: {
      error: 'Too many password reset attempts from this IP, please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return `password-reset:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: 'Too many password reset attempts',
        message: 'Too many password reset attempts. Please try again later.',
        retryAfter: '1 hour'
      });
    }
  }),

  // Registration endpoints
  registration: rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 registrations per hour
    message: {
      error: 'Too many registration attempts from this IP, please try again later.',
      retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return `registration:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn(`Registration rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        error: 'Too many registration attempts',
        message: 'Too many registration attempts. Please try again later.',
        retryAfter: '1 hour'
      });
    }
  })
};

/**
 * Create a custom rate limiter with specific configuration
 */
export const createCustomRateLimiter = (options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
  retryAfter?: string;
}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message || 'Too many requests from this IP, please try again later.',
      retryAfter: options.retryAfter || 'later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return `${options.keyPrefix}:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    },
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for ${options.keyPrefix} from IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method,
        keyPrefix: options.keyPrefix
      });
      res.status(429).json({
        error: 'Too many requests',
        message: options.message || 'Rate limit exceeded. Please try again later.',
        retryAfter: options.retryAfter || 'later'
      });
    }
  });
};

/**
 * Advanced rate limiter with user-specific limits
 */
export const createUserRateLimiter = (options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
  retryAfter?: string;
}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message || 'Too many requests, please try again later.',
      retryAfter: options.retryAfter || 'later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      const userId = (req as any).user?.id;
      const key = userId || req.ip || req.connection.remoteAddress || 'unknown';
      return `${options.keyPrefix}:${key}`;
    },
    handler: (req: Request, res: Response) => {
      const userId = (req as any).user?.id;
      logger.warn(`User rate limit exceeded for ${options.keyPrefix}`, {
        userId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method,
        keyPrefix: options.keyPrefix
      });
      res.status(429).json({
        error: 'Too many requests',
        message: options.message || 'Rate limit exceeded. Please try again later.',
        retryAfter: options.retryAfter || 'later'
      });
    }
  });
};

/**
 * Exponential backoff rate limiter for repeated violations
 */
export const createExponentialBackoffRateLimiter = (options: {
  baseWindowMs: number;
  maxWindowMs: number;
  baseMax: number;
  keyPrefix: string;
  message?: string;
  backoffMultiplier?: number;
}) => {
  const backoffMultiplier = options.backoffMultiplier || 2;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${options.keyPrefix}:${req.ip || req.connection.remoteAddress || 'unknown'}`;
      const violationKey = `${key}:violations`;
      
      // Get current violation count
      const violationCount = parseInt(await redisClient.get(violationKey) || '0');
      
      // Calculate current window and max based on violation count
      const currentWindowMs = Math.min(
        options.baseWindowMs * Math.pow(backoffMultiplier, violationCount),
        options.maxWindowMs
      );
      const currentMax = Math.max(1, Math.floor(options.baseMax / Math.pow(backoffMultiplier, violationCount)));
      
      // Create dynamic rate limiter
      const dynamicLimiter = rateLimit({
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.call(...args),
        }),
        windowMs: currentWindowMs,
        max: currentMax,
        keyGenerator: () => key,
        standardHeaders: true,
        legacyHeaders: false,
        handler: async (req: Request, res: Response) => {
          // Increment violation count
          const newViolationCount = violationCount + 1;
          await redisClient.setex(violationKey, Math.floor(options.maxWindowMs / 1000), newViolationCount.toString());
          
          const nextWindowMs = Math.min(
            options.baseWindowMs * Math.pow(backoffMultiplier, newViolationCount),
            options.maxWindowMs
          );
          
          logger.warn(`Exponential backoff triggered for ${options.keyPrefix}`, {
            ip: req.ip,
            violationCount: newViolationCount,
            currentWindowMs,
            nextWindowMs,
            currentMax,
            userAgent: req.get('user-agent'),
            path: req.path,
            method: req.method
          });
          
          res.status(429).json({
            error: 'Too many requests',
            message: options.message || 'Rate limit exceeded with exponential backoff. Please wait longer before trying again.',
            retryAfter: Math.floor(nextWindowMs / 1000),
            violationCount: newViolationCount,
            backoffActive: true
          });
        }
      });
      
      // Apply the dynamic rate limiter
      dynamicLimiter(req, res, next);
    } catch (error) {
      logger.error('Error in exponential backoff rate limiter:', error);
      next(); // Continue without rate limiting if error occurs
    }
  };
};

/**
 * Sliding window rate limiter with more precise control
 */
export const createSlidingWindowRateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
  retryAfter?: string;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `${options.keyPrefix}:${req.ip || req.connection.remoteAddress || 'unknown'}`;
      const now = Date.now();
      const windowStart = now - options.windowMs;
      
      // Use Redis sorted set for sliding window
      const pipe = redisClient.pipeline();
      
      // Remove old entries
      pipe.zremrangebyscore(key, '-inf', windowStart);
      
      // Count current requests in window
      pipe.zcard(key);
      
      // Add current request
      pipe.zadd(key, now, `${now}-${Math.random()}`);
      
      // Set expiration
      pipe.expire(key, Math.ceil(options.windowMs / 1000));
      
      const results = await pipe.exec();
      
      if (!results) {
        throw new Error('Redis pipeline failed');
      }
      
      const currentCount = results[1][1] as number;
      
      if (currentCount >= options.maxRequests) {
        // Get the oldest request in the current window
        const oldestRequest = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
        const retryAfter = oldestRequest.length > 0 
          ? Math.ceil((parseInt(oldestRequest[1]) + options.windowMs - now) / 1000)
          : Math.ceil(options.windowMs / 1000);
        
        logger.warn(`Sliding window rate limit exceeded for ${options.keyPrefix}`, {
          ip: req.ip,
          currentCount,
          maxRequests: options.maxRequests,
          windowMs: options.windowMs,
          retryAfter,
          userAgent: req.get('user-agent'),
          path: req.path,
          method: req.method
        });
        
        res.status(429).json({
          error: 'Too many requests',
          message: options.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: retryAfter,
          currentCount,
          maxRequests: options.maxRequests,
          windowMs: options.windowMs
        });
        return;
      }
      
      next();
    } catch (error) {
      logger.error('Error in sliding window rate limiter:', error);
      next(); // Continue without rate limiting if error occurs
    }
  };
};

/**
 * Rate limiter health check middleware
 */
export const rateLimiterHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await redisClient.ping();
    next();
  } catch (error) {
    logger.error('Redis health check failed:', error);
    // Continue without rate limiting if Redis is down
    next();
  }
};

/**
 * Clean up Redis connection on app shutdown
 */
export const closeRedisConnection = async () => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

// Export Redis client for other modules if needed
export { redisClient };