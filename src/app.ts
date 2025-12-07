import express from 'express';
import passport from './config/passport';
import { createRedisClient } from './utils/redis';
import { sessionMiddleware, fingerprintMiddleware, sessionActivityMiddleware } from './middleware/session';
import { requireAuth, requireRole, requirePermission, requireAdmin } from './middleware/rbac';
import oauthRoutes from './routes/oauth';
import { appConfig } from './config';
import { logger } from './utils/logger';
import { PERMISSIONS } from './utils/permissions';
import { 
  securityMiddleware, 
  enhancedRateLimiters,
  rateLimiters,
  csrfProtection,
  getCSRFTokenEndpoint,
  securityHealthCheck
} from './middleware';

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply basic security middleware globally
app.use(securityMiddleware.basic);

// Initialize Redis connection
let redisInitialized = false;

async function initializeRedis() {
  try {
    await createRedisClient();
    redisInitialized = true;
    logger.info('Redis connection initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis connection', { error });
    // Continue without Redis for development
  }
}

// Session middleware (requires Redis)
async function setupSessionMiddleware() {
  if (redisInitialized) {
    app.use(sessionMiddleware);
    app.use(fingerprintMiddleware);
    app.use(sessionActivityMiddleware);
    logger.info('Session middleware initialized with Redis');
  } else {
    logger.warn('Session middleware not initialized - Redis connection failed');
  }
}

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// OAuth routes
app.use('/auth', oauthRoutes);

// Public routes
app.get('/health', async (req, res) => {
  try {
    const securityHealth = await securityHealthCheck();
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      redis: redisInitialized ? 'connected' : 'disconnected',
      security: securityHealth
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Security health check failed'
    });
  }
});

// CSRF token endpoint
app.get('/csrf-token', getCSRFTokenEndpoint());

app.get('/login', (req, res) => {
  res.json({ 
    message: 'Login page',
    oauth: {
      google: '/auth/google',
      github: '/auth/github',
    },
    csrfToken: res.locals.csrfToken, // Available if CSRF middleware is applied
  });
});

// Demo authentication endpoints with security middleware
app.post('/auth/login', securityMiddleware.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simulate login validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        message: 'Please provide both email and password'
      });
    }
    
    // In a real application, this would validate against the database
    logger.info('Login attempt', { email, ip: req.ip });
    
    res.json({
      message: 'Login endpoint with security middleware',
      note: 'This is a demo endpoint - actual authentication logic would go here',
      security: {
        rateLimiting: 'Applied sliding window rate limiting',
        csrfProtection: 'Applied CSRF validation',
        inputSanitization: 'Applied XSS and SQL injection protection'
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

app.post('/auth/register', securityMiddleware.registration, async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    
    // Simulate registration validation
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
    
    // In a real application, this would create user in database
    logger.info('Registration attempt', { email, ip: req.ip });
    
    res.status(201).json({
      message: 'Registration endpoint with security middleware',
      note: 'This is a demo endpoint - actual registration logic would go here',
      security: {
        rateLimiting: 'Applied sliding window rate limiting for registrations',
        csrfProtection: 'Applied CSRF validation',
        inputSanitization: 'Applied XSS and SQL injection protection'
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed'
    });
  }
});

app.post('/auth/password-reset', securityMiddleware.passwordReset, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Simulate password reset validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide your email address'
      });
    }
    
    // In a real application, this would send reset email
    logger.info('Password reset attempt', { email, ip: req.ip });
    
    res.json({
      message: 'Password reset endpoint with security middleware',
      note: 'This is a demo endpoint - actual password reset logic would go here',
      security: {
        rateLimiting: 'Applied exponential backoff rate limiting',
        csrfProtection: 'Applied CSRF validation',
        inputSanitization: 'Applied XSS and SQL injection protection'
      }
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Password reset failed'
    });
  }
});

// Protected routes examples

// Basic authentication required
app.get('/dashboard', requireAuth, (req, res) => {
  res.json({
    message: 'Welcome to your dashboard',
    userId: req.session?.userId,
    sessionId: req.sessionID,
    trustScore: req.session?.trustScore,
  });
});

// Role-based access control examples
app.get('/admin', requireAdmin, (req, res) => {
  res.json({
    message: 'Admin panel',
    userRoles: req.userRoles,
    userPermissions: req.userPermissions,
  });
});

app.get('/moderator', requireRole(['admin', 'moderator']), (req, res) => {
  res.json({
    message: 'Moderator panel',
    userRoles: req.userRoles,
  });
});

// Permission-based access control examples
app.get('/users', requirePermission(PERMISSIONS.USER_READ), async (req, res) => {
  try {
    // Example: Get users list (would normally fetch from database)
    res.json({
      message: 'Users list',
      userPermissions: req.userPermissions,
      // users: await UserModel.findAll(),
    });
  } catch (error) {
    logger.error('Error getting users', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users', requirePermission(PERMISSIONS.USER_WRITE), async (req, res) => {
  try {
    // Example: Create user (would normally create in database)
    res.json({
      message: 'User created',
      // user: await UserModel.create(req.body),
    });
  } catch (error) {
    logger.error('Error creating user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/users/:id', requirePermission(PERMISSIONS.USER_DELETE), async (req, res) => {
  try {
    // Example: Delete user (would normally delete from database)
    res.json({
      message: 'User deleted',
      userId: req.params.id,
    });
  } catch (error) {
    logger.error('Error deleting user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Multiple permission requirements
app.get('/audit-logs', 
  requirePermission([PERMISSIONS.AUDIT_READ, PERMISSIONS.SYSTEM_MONITORING], { requireAll: false }),
  async (req, res) => {
    try {
      res.json({
        message: 'Audit logs',
        // logs: await AuditLogModel.findAll(),
      });
    } catch (error) {
      logger.error('Error getting audit logs', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Profile routes (user can access their own data)
app.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Example: Get user profile
    res.json({
      message: 'User profile',
      userId,
      // profile: await UserModel.findById(userId),
      // oauthAccounts: await UserModel.getOAuthAccounts(userId),
    });
  } catch (error) {
    logger.error('Error getting profile', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Session management routes
app.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Example: Get user sessions
    res.json({
      message: 'User sessions',
      currentSessionId: req.sessionID,
      // sessions: await SessionModel.findByUserId(userId),
    });
  } catch (error) {
    logger.error('Error getting sessions', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { sessionId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Example: Invalidate session
    res.json({
      message: 'Session invalidated',
      sessionId,
      // result: await SessionModel.invalidateByToken(sessionId),
    });
  } catch (error) {
    logger.error('Error invalidating session', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
app.post('/logout', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.userId;
    const sessionId = req.sessionID;

    // Invalidate session in database
    // await SessionModel.invalidateByToken(sessionId);

    // Destroy Express session
    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session', { error: err });
        return res.status(500).json({ error: 'Error logging out' });
      }

      logger.info('User logged out successfully', { userId, sessionId });
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    logger.error('Error during logout', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { 
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: appConfig.server.nodeEnv === 'development' ? error.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize the application
async function initializeApp() {
  try {
    await initializeRedis();
    await setupSessionMiddleware();
    
    const port = appConfig.server.port;
    app.listen(port, () => {
      logger.info(`Server started on port ${port}`, {
        port,
        nodeEnv: appConfig.server.nodeEnv,
        redis: redisInitialized ? 'enabled' : 'disabled',
      });
    });
  } catch (error) {
    logger.error('Failed to initialize application', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  
  try {
    if (redisInitialized) {
      const { closeRedisConnection } = await import('./utils/redis');
      await closeRedisConnection();
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  
  try {
    if (redisInitialized) {
      const { closeRedisConnection } = await import('./utils/redis');
      await closeRedisConnection();
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
});

// Start the application
if (require.main === module) {
  initializeApp();
}

export default app;