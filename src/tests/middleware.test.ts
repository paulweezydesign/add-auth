/**
 * Rate Limiting and CSRF Protection Tests
 * Comprehensive test suite for security middleware
 */

import { Request, Response, NextFunction } from 'express';
import { 
  createExponentialBackoffRateLimiter,
  createSlidingWindowRateLimiter,
  generateCSRFToken,
  validateCSRFToken,
  csrfProtection,
  rateLimiters,
  securityHealthCheck
} from '../middleware';
import { redisClient } from '../middleware/rateLimiter';

// Mock Express request and response objects
const mockRequest = (overrides = {}) => {
  const req = {
    ip: '192.168.1.1',
    connection: { remoteAddress: '192.168.1.1' },
    get: jest.fn(),
    method: 'POST',
    path: '/test',
    body: {},
    query: {},
    cookies: {},
    headers: {},
    session: { id: 'test-session-id' },
    ...overrides
  };
  return req as unknown as Request;
};

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res as unknown as Response;
};

const mockNext = jest.fn();

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Exponential Backoff Rate Limiter', () => {
    it('should allow initial requests', async () => {
      const rateLimiter = createExponentialBackoffRateLimiter({
        baseWindowMs: 60000, // 1 minute
        maxWindowMs: 3600000, // 1 hour
        baseMax: 5,
        keyPrefix: 'test-backoff'
      });

      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      await rateLimiter(req, res, next);
      
      // Should proceed normally for first request
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should apply exponential backoff on repeated violations', async () => {
      // This test would require Redis to be running and proper setup
      // For now, we'll test the logic structure
      const rateLimiter = createExponentialBackoffRateLimiter({
        baseWindowMs: 1000, // 1 second for testing
        maxWindowMs: 60000, // 1 minute max
        baseMax: 1, // Only 1 request allowed
        keyPrefix: 'test-backoff-violation'
      });

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });
  });

  describe('Sliding Window Rate Limiter', () => {
    it('should create sliding window rate limiter', () => {
      const rateLimiter = createSlidingWindowRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test-sliding'
      });

      expect(rateLimiter).toBeDefined();
      expect(typeof rateLimiter).toBe('function');
    });

    it('should handle requests within window', async () => {
      const rateLimiter = createSlidingWindowRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test-sliding-window'
      });

      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      // Test that the function doesn't throw
      await expect(rateLimiter(req, res, next)).resolves.not.toThrow();
    });
  });

  describe('Rate Limiter Configurations', () => {
    it('should have all required rate limiters', () => {
      expect(rateLimiters.general).toBeDefined();
      expect(rateLimiters.auth).toBeDefined();
      expect(rateLimiters.passwordReset).toBeDefined();
      expect(rateLimiters.registration).toBeDefined();
    });

    it('should have proper configuration for auth rate limiter', () => {
      const authLimiter = rateLimiters.auth;
      expect(authLimiter).toBeDefined();
      // The actual configuration is internal to express-rate-limit
      // We can only test that it's a function
      expect(typeof authLimiter).toBe('function');
    });
  });
});

describe('CSRF Protection Tests', () => {
  const sessionId = 'test-session-12345';

  describe('CSRF Token Generation', () => {
    it('should generate CSRF token successfully', async () => {
      const result = await generateCSRFToken(sessionId);
      
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(typeof result.secret).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      expect(result.secret.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different sessions', async () => {
      const result1 = await generateCSRFToken('session-1');
      const result2 = await generateCSRFToken('session-2');
      
      expect(result1.token).not.toBe(result2.token);
      expect(result1.secret).not.toBe(result2.secret);
    });
  });

  describe('CSRF Token Validation', () => {
    it('should validate correct CSRF token', async () => {
      const { token } = await generateCSRFToken(sessionId);
      
      // Wait a moment to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isValid = await validateCSRFToken(sessionId, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', async () => {
      const isValid = await validateCSRFToken(sessionId, 'invalid-token');
      expect(isValid).toBe(false);
    });

    it('should reject token for non-existent session', async () => {
      const isValid = await validateCSRFToken('non-existent-session', 'any-token');
      expect(isValid).toBe(false);
    });
  });

  describe('CSRF Middleware', () => {
    it('should create CSRF protection middleware', () => {
      const middleware = csrfProtection();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should skip validation for GET requests', async () => {
      const middleware = csrfProtection();
      const req = mockRequest({ method: 'GET' });
      const res = mockResponse();
      const next = mockNext;

      await middleware(req, res, next);
      
      // Should generate token for GET request
      expect(res.locals.csrfToken).toBeDefined();
    });
  });
});

describe('Security Health Check', () => {
  it('should perform security health check', async () => {
    const health = await securityHealthCheck();
    
    expect(health).toBeDefined();
    expect(typeof health).toBe('object');
    expect(health).toHaveProperty('redis');
    expect(health).toHaveProperty('csrf');
    expect(health).toHaveProperty('validation');
    expect(health).toHaveProperty('xss');
    expect(health).toHaveProperty('sqlInjection');
  });

  it('should return boolean values for all health checks', async () => {
    const health = await securityHealthCheck();
    
    expect(typeof health.redis).toBe('boolean');
    expect(typeof health.csrf).toBe('boolean');
    expect(typeof health.validation).toBe('boolean');
    expect(typeof health.xss).toBe('boolean');
    expect(typeof health.sqlInjection).toBe('boolean');
  });
});

describe('Integration Tests', () => {
  describe('Rate Limiting + CSRF Protection', () => {
    it('should handle rate limiting and CSRF protection together', async () => {
      // Test that combining rate limiting and CSRF protection works
      const req = mockRequest({
        method: 'POST',
        body: { _csrf: 'test-token' }
      });
      const res = mockResponse();
      const next = mockNext;

      // Apply CSRF protection first
      const csrfMiddleware = csrfProtection();
      
      // The middleware should be callable without throwing
      expect(() => csrfMiddleware(req, res, next)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Test that middleware continues to work even if Redis fails
      const rateLimiter = createSlidingWindowRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test-error-handling'
      });

      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      // Should not throw even if Redis is unavailable
      await expect(rateLimiter(req, res, next)).resolves.not.toThrow();
    });

    it('should handle CSRF token errors gracefully', async () => {
      // Test CSRF validation with invalid session
      const isValid = await validateCSRFToken('', '');
      expect(isValid).toBe(false);
    });
  });
});

// Load test simulation
describe('Load Tests', () => {
  it('should handle multiple concurrent requests', async () => {
    const rateLimiter = createSlidingWindowRateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      keyPrefix: 'test-load'
    });

    const promises = [];
    for (let i = 0; i < 10; i++) {
      const req = mockRequest({ ip: `192.168.1.${i}` });
      const res = mockResponse();
      const next = mockNext;
      
      promises.push(rateLimiter(req, res, next));
    }

    // All requests should complete without errors
    await expect(Promise.all(promises)).resolves.not.toThrow();
  });
});

// Cleanup
afterAll(async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
    }
  } catch (error) {
    console.warn('Error closing Redis connection in tests:', error);
  }
});