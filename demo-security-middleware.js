/**
 * Demonstration Script for Rate Limiting and CSRF Protection
 * Shows how the security middleware works in practice
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock Redis client for demonstration
const mockRedisClient = {
  data: new Map(),
  expiration: new Map(),
  
  async setex(key, seconds, value) {
    this.data.set(key, value);
    this.expiration.set(key, Date.now() + (seconds * 1000));
    return 'OK';
  },
  
  async get(key) {
    const expiry = this.expiration.get(key);
    if (expiry && Date.now() > expiry) {
      this.data.delete(key);
      this.expiration.delete(key);
      return null;
    }
    return this.data.get(key) || null;
  },
  
  async del(key) {
    this.data.delete(key);
    this.expiration.delete(key);
    return 1;
  },
  
  async ping() {
    return 'PONG';
  },
  
  async keys(pattern) {
    const keys = Array.from(this.data.keys());
    if (pattern === '*') return keys;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  },
  
  pipeline() {
    return {
      zremrangebyscore: () => this,
      zcard: () => this,
      zadd: () => this,
      expire: () => this,
      exec: async () => [[null, 'OK'], [null, 0], [null, 1], [null, 1]]
    };
  },
  
  async zrange() {
    return [];
  }
};

// Simple rate limiting middleware for demonstration
const createSimpleRateLimiter = (windowMs, maxRequests, keyPrefix) => {
  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}:${req.ip || req.connection.remoteAddress || 'unknown'}`;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Get existing requests for this key
      const requestsData = await mockRedisClient.get(key);
      let requests = requestsData ? JSON.parse(requestsData) : [];
      
      // Remove old requests
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if limit exceeded
      if (requests.length >= maxRequests) {
        const oldestRequest = Math.min(...requests);
        const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
        
        console.log(`🚫 Rate limit exceeded for ${keyPrefix} from IP: ${req.ip}`);
        
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded for ${keyPrefix}. Please try again later.`,
          retryAfter: retryAfter,
          currentCount: requests.length,
          maxRequests: maxRequests,
          windowMs: windowMs
        });
      }
      
      // Add current request
      requests.push(now);
      await mockRedisClient.setex(key, Math.ceil(windowMs / 1000), JSON.stringify(requests));
      
      next();
    } catch (error) {
      console.error('Error in rate limiter:', error);
      next(); // Continue without rate limiting if error occurs
    }
  };
};

// Exponential backoff rate limiter for demonstration
const createExponentialBackoffRateLimiter = (baseWindowMs, maxWindowMs, baseMax, keyPrefix) => {
  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}:${req.ip || req.connection.remoteAddress || 'unknown'}`;
      const violationKey = `${key}:violations`;
      
      // Get current violation count
      const violationCount = parseInt(await mockRedisClient.get(violationKey) || '0');
      
      // Calculate current window and max based on violation count
      const backoffMultiplier = 2;
      const currentWindowMs = Math.min(
        baseWindowMs * Math.pow(backoffMultiplier, violationCount),
        maxWindowMs
      );
      const currentMax = Math.max(1, Math.floor(baseMax / Math.pow(backoffMultiplier, violationCount)));
      
      // Check current requests
      const requestsData = await mockRedisClient.get(key);
      let requests = requestsData ? JSON.parse(requestsData) : [];
      const now = Date.now();
      const windowStart = now - currentWindowMs;
      
      // Remove old requests
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      if (requests.length >= currentMax) {
        // Increment violation count
        const newViolationCount = violationCount + 1;
        await mockRedisClient.setex(violationKey, Math.floor(maxWindowMs / 1000), newViolationCount.toString());
        
        const nextWindowMs = Math.min(
          baseWindowMs * Math.pow(backoffMultiplier, newViolationCount),
          maxWindowMs
        );
        
        console.log(`⚡ Exponential backoff triggered for ${keyPrefix} from IP: ${req.ip}`);
        console.log(`   Violation count: ${newViolationCount}, Next window: ${nextWindowMs}ms`);
        
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded with exponential backoff. Please wait longer before trying again.`,
          retryAfter: Math.floor(nextWindowMs / 1000),
          violationCount: newViolationCount,
          backoffActive: true,
          currentMax: currentMax,
          windowMs: currentWindowMs
        });
      }
      
      // Add current request
      requests.push(now);
      await mockRedisClient.setex(key, Math.ceil(currentWindowMs / 1000), JSON.stringify(requests));
      
      next();
    } catch (error) {
      console.error('Error in exponential backoff rate limiter:', error);
      next();
    }
  };
};

// Simple CSRF protection for demonstration
const crypto = require('crypto');

const generateCSRFToken = (sessionId) => {
  const secret = crypto.randomBytes(32).toString('hex');
  const token = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
  return { token, secret };
};

const validateCSRFToken = async (sessionId, token) => {
  try {
    const tokenData = await mockRedisClient.get(`csrf:${sessionId}`);
    if (!tokenData) return false;
    
    const { secret, expiresAt } = JSON.parse(tokenData);
    if (Date.now() > expiresAt) {
      await mockRedisClient.del(`csrf:${sessionId}`);
      return false;
    }
    
    const expectedToken = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
    return expectedToken === token;
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
};

const csrfProtection = () => {
  return async (req, res, next) => {
    try {
      const sessionId = req.sessionID || req.ip || 'default-session';
      
      // Generate token for GET requests
      if (req.method === 'GET') {
        const { token, secret } = generateCSRFToken(sessionId);
        await mockRedisClient.setex(`csrf:${sessionId}`, 3600, JSON.stringify({
          secret,
          token,
          expiresAt: Date.now() + 3600000
        }));
        
        res.locals.csrfToken = token;
        res.setHeader('X-CSRF-Token', token);
        return next();
      }
      
      // Validate token for other methods
      const token = req.get('x-csrf-token') || req.body._csrf || req.query._csrf;
      
      if (!token) {
        console.log(`🛡️ CSRF token missing for ${req.method} ${req.path} from IP: ${req.ip}`);
        return res.status(403).json({
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request'
        });
      }
      
      const isValid = await validateCSRFToken(sessionId, token);
      
      if (!isValid) {
        console.log(`🛡️ Invalid CSRF token for ${req.method} ${req.path} from IP: ${req.ip}`);
        return res.status(403).json({
          error: 'Invalid CSRF token',
          message: 'CSRF token validation failed'
        });
      }
      
      console.log(`✅ CSRF token validated for ${req.method} ${req.path}`);
      next();
    } catch (error) {
      console.error('CSRF validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'CSRF validation failed'
      });
    }
  };
};

// Rate limiters
const loginRateLimiter = createSimpleRateLimiter(15 * 60 * 1000, 5, 'login'); // 5 per 15 minutes
const registrationRateLimiter = createSimpleRateLimiter(60 * 60 * 1000, 3, 'registration'); // 3 per hour
const passwordResetRateLimiter = createExponentialBackoffRateLimiter(
  60 * 60 * 1000, // 1 hour base
  24 * 60 * 60 * 1000, // 24 hours max
  3, // 3 attempts base
  'password-reset'
);

// Apply middleware
app.use(csrfProtection());

// Routes
app.get('/health', async (req, res) => {
  const redisHealth = await mockRedisClient.ping() === 'PONG';
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    security: {
      redis: redisHealth,
      csrf: true,
      rateLimiting: true
    },
    csrfToken: res.locals.csrfToken
  });
});

app.get('/csrf-token', (req, res) => {
  res.json({
    csrfToken: res.locals.csrfToken,
    expiresAt: Date.now() + 3600000
  });
});

app.post('/auth/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        message: 'Please provide both email and password'
      });
    }
    
    console.log(`🔐 Login attempt for ${email} from IP: ${req.ip}`);
    
    res.json({
      message: 'Login endpoint with security middleware',
      note: 'This is a demo endpoint - actual authentication logic would go here',
      security: {
        rateLimiting: 'Applied sliding window rate limiting (5 per 15 minutes)',
        csrfProtection: 'Applied CSRF validation',
        inputSanitization: 'Applied input validation'
      },
      user: { email },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

app.post('/auth/register', registrationRateLimiter, async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'All fields are required',
        message: 'Please provide email, password, and confirm password'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        message: 'Password and confirm password must match'
      });
    }
    
    console.log(`👤 Registration attempt for ${email} from IP: ${req.ip}`);
    
    res.status(201).json({
      message: 'Registration endpoint with security middleware',
      note: 'This is a demo endpoint - actual registration logic would go here',
      security: {
        rateLimiting: 'Applied sliding window rate limiting (3 per hour)',
        csrfProtection: 'Applied CSRF validation',
        inputSanitization: 'Applied input validation'
      },
      user: { email },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed'
    });
  }
});

app.post('/auth/password-reset', passwordResetRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide your email address'
      });
    }
    
    console.log(`🔄 Password reset attempt for ${email} from IP: ${req.ip}`);
    
    res.json({
      message: 'Password reset endpoint with security middleware',
      note: 'This is a demo endpoint - actual password reset logic would go here',
      security: {
        rateLimiting: 'Applied exponential backoff rate limiting',
        csrfProtection: 'Applied CSRF validation',
        inputSanitization: 'Applied input validation'
      },
      email: email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Password reset failed'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Security Middleware Demo Server Started');
  console.log(`📍 Server running on port ${PORT}`);
  console.log('');
  console.log('🛡️ Security Features Enabled:');
  console.log('   ✅ Rate Limiting (sliding window)');
  console.log('   ✅ Exponential Backoff (password reset)');
  console.log('   ✅ CSRF Protection');
  console.log('   ✅ Input Validation');
  console.log('');
  console.log('📋 Test Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/csrf-token`);
  console.log(`   POST http://localhost:${PORT}/auth/login`);
  console.log(`   POST http://localhost:${PORT}/auth/register`);
  console.log(`   POST http://localhost:${PORT}/auth/password-reset`);
  console.log('');
  console.log('🧪 To test rate limiting:');
  console.log('   Run: node src/tests/load-test.js');
  console.log('');
  console.log('📄 Documentation available in:');
  console.log('   - /home/weezyone/apps/add-auth-rate-limit/src/middleware/rateLimiter.ts');
  console.log('   - /home/weezyone/apps/add-auth-rate-limit/src/middleware/csrfProtection.ts');
  console.log('   - /home/weezyone/apps/add-auth-rate-limit/src/tests/middleware.test.ts');
});

module.exports = app;