# @paulweezydesign/add-auth

A comprehensive authentication and authorization library for Node.js applications with TypeScript support. Features include RBAC (Role-Based Access Control), OAuth integration, session management, security middleware, and much more.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Role-Based Access Control (RBAC)
  - Permission-based authorization
  - Session management with Redis
  - OAuth 2.0 integration (Google, GitHub)

- 🛡️ **Security Middleware**
  - CSRF protection
  - XSS protection
  - SQL injection prevention
  - Rate limiting (general, auth, password reset, registration)
  - Input validation and sanitization
  - Token blacklisting

- 👤 **User Management**
  - User registration and login
  - Password hashing with bcrypt
  - Password reset functionality
  - Email verification
  - Device fingerprinting

- 📊 **Audit & Monitoring**
  - Comprehensive audit logging
  - Session tracking
  - Security event monitoring
  - Health check endpoints

- 🌐 **Internationalization**
  - Multi-language support
  - Localized validation messages
  - Translation helpers

## Installation

```bash
npm install @paulweezydesign/add-auth
```

### Peer Dependencies

The following packages are required:

```bash
npm install express pg redis
```

## Quick Start

### Basic Setup

```typescript
import express from 'express';
import { 
  applySecurityMiddleware,
  requireAuth,
  UserModel,
  db
} from '@paulweezydesign/add-auth';

const app = express();

// Apply security middleware
app.use(express.json());
app.use(applySecurityMiddleware('production'));

// Protected route example
app.get('/api/profile', requireAuth, async (req, res) => {
  const userId = req.session?.userId;
  const user = await UserModel.findById(userId);
  res.json({ user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=your_db
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Session
SESSION_SECRET=your-session-secret
SESSION_EXPIRY=86400000

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:3000
```

## Usage Examples

### User Authentication

```typescript
import { UserModel, AuthUtils } from '@paulweezydesign/add-auth';

// Register a new user
const user = await UserModel.create({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'SecurePassword123!'
});

// Login
const loginUser = await UserModel.findByEmail('user@example.com');
if (loginUser && await AuthUtils.verifyPassword('SecurePassword123!', loginUser.password_hash)) {
  const tokens = await createAuthenticationTokens({
    userId: loginUser.id,
    email: loginUser.email,
    roles: ['user']
  });
  console.log('Access Token:', tokens.accessToken);
}
```

### Role-Based Access Control

```typescript
import { requireRole, requirePermission, requireAuth } from '@paulweezydesign/add-auth';

// Require specific role
app.get('/admin/dashboard', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin Dashboard' });
});

// Require specific permission
app.post('/posts/create', requireAuth, requirePermission('posts:create'), (req, res) => {
  // Create post logic
});

// Require any of multiple roles
app.get('/moderation', requireAuth, requireRole(['admin', 'moderator']), (req, res) => {
  res.json({ message: 'Moderation Panel' });
});
```

### Security Middleware Stacks

```typescript
import { securityMiddleware } from '@paulweezydesign/add-auth';

// Use pre-configured security stacks
app.post('/auth/login', securityMiddleware.auth, loginController);
app.post('/auth/register', securityMiddleware.registration, registerController);
app.post('/auth/forgot-password', securityMiddleware.passwordReset, forgotPasswordController);
app.use('/admin', securityMiddleware.admin, adminRoutes);
```

### Custom Rate Limiting

```typescript
import { createCustomRateLimiter } from '@paulweezydesign/add-auth';

// Create custom rate limiter
const apiLimiter = createCustomRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

### Session Management

```typescript
import { SessionService, sessionMiddleware } from '@paulweezydesign/add-auth';

// Apply session middleware
app.use(sessionMiddleware);

// Get user sessions
const sessions = await SessionService.getUserSessions(userId);

// Revoke a session
await SessionService.revokeSession(sessionId);

// Revoke all user sessions
await SessionService.revokeAllUserSessions(userId);
```

### Password Reset

```typescript
import { PasswordResetManager, emailService } from '@paulweezydesign/add-auth';

// Request password reset
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findByEmail(email);
  
  if (user) {
    const resetToken = await PasswordResetManager.createResetToken(user.id);
    await emailService.sendPasswordResetEmail(email, resetToken, user.username);
  }
  
  res.json({ message: 'If email exists, reset link has been sent' });
});

// Reset password with token
app.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  await PasswordResetManager.resetPassword(token, newPassword);
  res.json({ message: 'Password reset successful' });
});
```

### Token Management

```typescript
import { 
  generateAccessToken, 
  validateAccessToken,
  isTokenBlacklisted,
  addToBlacklist 
} from '@paulweezydesign/add-auth';

// Generate token
const accessToken = await generateAccessToken({ 
  userId: user.id, 
  email: user.email 
});

// Validate token
const validation = await validateAccessToken(token);
if (validation.valid) {
  console.log('Token payload:', validation.payload);
}

// Blacklist a token (e.g., on logout)
await addToBlacklist(token, user.id, 'User logout');

// Check if token is blacklisted
const isBlacklisted = await isTokenBlacklisted(token);
```

### Input Validation & Sanitization

```typescript
import { 
  validate, 
  validationSchemas,
  sanitizeInput,
  xssProtection 
} from '@paulweezydesign/add-auth';

// Use built-in validation schemas
app.post('/register', 
  validate(validationSchemas.registration),
  registerController
);

// Apply XSS protection
app.use(xssProtection());

// Sanitize specific input
app.use(sanitizeInput('body'));
app.use(sanitizeInput('query'));
```

### Audit Logging

```typescript
import { AuditLogModel } from '@paulweezydesign/add-auth';

// Create audit log
await AuditLogModel.create({
  user_id: userId,
  action: 'user.login',
  resource_type: 'authentication',
  resource_id: sessionId,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  details: {
    success: true,
    method: '2fa'
  }
});

// Query audit logs
const logs = await AuditLogModel.findByUser(userId, { limit: 50 });
```

## API Reference

### Middleware

- `requireAuth` - Require authentication
- `optionalAuth` - Optional authentication
- `requireRole(roles)` - Require specific role(s)
- `requirePermission(permissions)` - Require specific permission(s)
- `requireOwnership(field)` - Require resource ownership
- `applySecurityMiddleware(env)` - Apply security stack based on environment
- `sessionMiddleware` - Session management middleware
- `rateLimiters` - Pre-configured rate limiters
- `csrfProtection()` - CSRF protection middleware
- `xssProtection()` - XSS protection middleware
- `sqlInjectionPrevention()` - SQL injection prevention

### Models

- `UserModel` - User database operations
- `RoleModel` - Role management
- `SessionModel` - Session management
- `AuditLogModel` - Audit logging

### Utilities

- `AuthUtils` - Authentication utilities
- `generateAccessToken(payload)` - Generate JWT access token
- `validateAccessToken(token)` - Validate access token
- `createRefreshToken(payload)` - Create refresh token
- `validateRefreshToken(token)` - Validate refresh token
- `PermissionService` - Permission management service
- `EmailService` - Email sending service
- `FingerprintService` - Device fingerprinting
- `logger` - Winston logger instance

### Security

- `PasswordResetManager` - Password reset functionality
- `addToBlacklist(token, userId, reason)` - Blacklist a token
- `isTokenBlacklisted(token)` - Check if token is blacklisted
- `performLogout(userId, token)` - Complete logout process
- `performSecurityRevocation(userId, reason)` - Revoke all user tokens

## Database Setup

The library uses PostgreSQL. Run migrations to set up the database schema:

```typescript
import { db } from '@paulweezydesign/add-auth';

// Run migrations
// See src/database/migrate.ts for migration details

// Or manually create tables using the provided SQL schema
```

## Configuration Options

### Security Middleware Configuration

```typescript
import { securityConfigs, applySecurityMiddleware } from '@paulweezydesign/add-auth';

// Use environment-based presets
app.use(applySecurityMiddleware('production')); // or 'development', 'testing'

// Custom configuration
const customConfig = {
  csrf: {
    saltLength: 32,
    secretLength: 64,
    tokenExpiry: 3600000 // 1 hour
  },
  xss: {
    stripIgnoreTag: true,
    css: false
  },
  sqlInjection: {
    strict: true,
    logAttempts: true
  }
};
```

## TypeScript Support

This library is written in TypeScript and includes type definitions. All types are exported:

```typescript
import type { 
  User, 
  Role, 
  JWTPayload, 
  TokenValidationResult,
  DeviceFingerprint,
  AuditLog 
} from '@paulweezydesign/add-auth';
```

## Error Handling

```typescript
import { 
  globalErrorHandler, 
  notFoundHandler,
  asyncHandler 
} from '@paulweezydesign/add-auth';

// Wrap async route handlers
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));

// Apply global error handler (should be last middleware)
app.use(notFoundHandler);
app.use(globalErrorHandler);
```

## Health Checks

```typescript
import { securityHealthCheck } from '@paulweezydesign/add-auth';

app.get('/health', async (req, res) => {
  const health = await securityHealthCheck();
  res.json({
    status: 'ok',
    security: health
  });
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on [GitHub](https://github.com/paulweezydesign/add-auth/issues).

## Changelog

### 1.0.0
- Initial release
- Complete authentication and authorization system
- RBAC support
- OAuth integration
- Comprehensive security middleware
- Session management
- Audit logging

