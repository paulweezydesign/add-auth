import session from 'express-session';
import { RequestHandler } from 'express';
import { getRedisClient } from '../utils/redis';
import { appConfig } from '../config';
import { logger } from '../utils/logger';
import { FingerprintService, DeviceFingerprint } from '../utils/fingerprint';
import { SessionModel } from '../models/Session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    roleId?: string;
    fingerprint?: DeviceFingerprint;
    isAuthenticated?: boolean;
    lastActivity?: Date;
    trustScore?: number;
  }
}

// Custom Redis session store
class RedisSessionStore extends session.Store {
  private redisClient;
  private ttl: number;

  constructor(options: { ttl?: number } = {}) {
    super();
    this.redisClient = getRedisClient();
    this.ttl = options.ttl || appConfig.security.sessionTimeout / 1000; // Convert to seconds
  }

  async get(sid: string, callback: (err: any, session?: session.SessionData) => void): Promise<void> {
    try {
      const key = `session:${sid}`;
      const data = await this.redisClient.get(key);
      
      if (!data) {
        return callback(null, null);
      }

      const session = JSON.parse(data);
      callback(null, session);
    } catch (error) {
      logger.error('Error getting session from Redis', { sessionId: sid, error });
      callback(error);
    }
  }

  async set(sid: string, session: session.SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = `session:${sid}`;
      const data = JSON.stringify(session);
      
      await this.redisClient.setEx(key, this.ttl, data);
      
      if (callback) callback();
    } catch (error) {
      logger.error('Error setting session in Redis', { sessionId: sid, error });
      if (callback) callback(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = `session:${sid}`;
      await this.redisClient.del(key);
      
      if (callback) callback();
    } catch (error) {
      logger.error('Error destroying session in Redis', { sessionId: sid, error });
      if (callback) callback(error);
    }
  }

  async touch(sid: string, session: session.SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      const key = `session:${sid}`;
      await this.redisClient.expire(key, this.ttl);
      
      if (callback) callback();
    } catch (error) {
      logger.error('Error touching session in Redis', { sessionId: sid, error });
      if (callback) callback(error);
    }
  }

  async clear(callback?: (err?: any) => void): Promise<void> {
    try {
      const keys = await this.redisClient.keys('session:*');
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
      
      if (callback) callback();
    } catch (error) {
      logger.error('Error clearing sessions from Redis', { error });
      if (callback) callback(error);
    }
  }

  async length(callback: (err: any, length?: number) => void): Promise<void> {
    try {
      const keys = await this.redisClient.keys('session:*');
      callback(null, keys.length);
    } catch (error) {
      logger.error('Error getting session count from Redis', { error });
      callback(error);
    }
  }
}

// Session configuration
export const sessionConfig = {
  store: new RedisSessionStore(),
  secret: appConfig.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: appConfig.server.nodeEnv === 'production',
    httpOnly: true,
    maxAge: appConfig.security.sessionTimeout,
    sameSite: 'strict' as const,
  },
  name: 'sessionId',
};

// Session middleware
export const sessionMiddleware: RequestHandler = session(sessionConfig);

// Fingerprint validation middleware
export const fingerprintMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const currentFingerprint = FingerprintService.generateFingerprint(req);
    
    // Store current fingerprint in session
    if (req.session) {
      if (req.session.fingerprint) {
        // Validate against stored fingerprint
        const validation = FingerprintService.validateFingerprint(
          currentFingerprint,
          req.session.fingerprint
        );

        if (!validation.isValid) {
          logger.warn('Session fingerprint validation failed', {
            sessionId: req.sessionID,
            userId: req.session.userId,
            risk: validation.risk,
            changes: validation.changes,
          });

          // Handle based on risk level
          if (validation.risk === 'high') {
            // Destroy session and require re-authentication
            req.session.destroy((err) => {
              if (err) {
                logger.error('Error destroying session after fingerprint validation failure', { error: err });
              }
            });
            
            return res.status(401).json({
              error: 'Session security validation failed',
              message: 'Please log in again',
              code: 'FINGERPRINT_VALIDATION_FAILED',
            });
          } else if (validation.risk === 'medium') {
            // Update fingerprint but log the change
            req.session.fingerprint = currentFingerprint;
            req.session.trustScore = (req.session.trustScore || 1.0) * 0.8;
            
            logger.info('Session fingerprint updated due to medium risk changes', {
              sessionId: req.sessionID,
              userId: req.session.userId,
              changes: validation.changes,
            });
          }
        }
      } else {
        // First time - store fingerprint
        req.session.fingerprint = currentFingerprint;
        req.session.trustScore = 0.5; // Neutral score for new sessions
      }
    }

    next();
  } catch (error) {
    logger.error('Error in fingerprint middleware', { error });
    next(error);
  }
};

// Session activity tracking middleware
export const sessionActivityMiddleware: RequestHandler = async (req, res, next) => {
  try {
    if (req.session && req.session.isAuthenticated && req.session.userId) {
      const now = new Date();
      const lastActivity = req.session.lastActivity ? new Date(req.session.lastActivity) : null;
      
      // Check for session timeout
      if (lastActivity) {
        const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
        if (timeSinceLastActivity > appConfig.security.sessionTimeout) {
          logger.info('Session expired due to inactivity', {
            sessionId: req.sessionID,
            userId: req.session.userId,
            lastActivity: lastActivity.toISOString(),
          });
          
          req.session.destroy((err) => {
            if (err) {
              logger.error('Error destroying expired session', { error: err });
            }
          });
          
          return res.status(401).json({
            error: 'Session expired',
            message: 'Please log in again',
            code: 'SESSION_EXPIRED',
          });
        }
      }
      
      // Update last activity
      req.session.lastActivity = now;
      
      // Update session in database
      try {
        await SessionModel.updateLastAccessed(req.sessionID);
      } catch (error) {
        logger.error('Error updating session last accessed in database', { 
          sessionId: req.sessionID,
          error 
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error in session activity middleware', { error });
    next(error);
  }
};

// Session cleanup utility
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    // Clean up database sessions
    const deletedCount = await SessionModel.cleanupExpiredSessions();
    logger.info('Cleaned up expired sessions from database', { deletedCount });
    
    // Clean up Redis sessions (they should auto-expire, but this is a safety measure)
    const redisClient = getRedisClient();
    const keys = await redisClient.keys('session:*');
    
    let expiredRedisSessionsCount = 0;
    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl === -1) {
        // Session without TTL, remove it
        await redisClient.del(key);
        expiredRedisSessionsCount++;
      }
    }
    
    if (expiredRedisSessionsCount > 0) {
      logger.info('Cleaned up orphaned Redis sessions', { count: expiredRedisSessionsCount });
    }
  } catch (error) {
    logger.error('Error during session cleanup', { error });
  }
};

// Schedule session cleanup (run every hour)
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

export default sessionMiddleware;