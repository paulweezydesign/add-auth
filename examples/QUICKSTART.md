# Quick Start Guide - Authentication Examples

This guide will help you get started with any of the authentication examples.

## Prerequisites

Before running any example, ensure you have:

- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed and running
- **Redis** 6+ (for session-auth and oauth-social examples)
- **Git** installed

## General Setup Steps

### 1. Database Setup

All examples use the same PostgreSQL database. Set it up once:

```bash
# Create the database
createdb add_auth_examples

# Or using psql
psql -U postgres
CREATE DATABASE add_auth_examples;
\q
```

### 2. Run Migrations

From the **main project directory** (not the examples folder):

```bash
# Install main project dependencies
npm install

# Run database migrations
npm run migrate
```

This creates the necessary tables:
- `users` - User accounts
- `sessions` - Session data
- `roles` - User roles
- `user_roles` - Role assignments
- `oauth_accounts` - OAuth provider linkages
- `password_reset_tokens` - Password reset tokens
- `audit_logs` - Audit trail

### 3. Choose an Example

Navigate to the example you want to try:

```bash
cd examples/jwt-auth          # JWT authentication
cd examples/session-auth      # Session-based auth
cd examples/oauth-social      # OAuth (Google/GitHub)
cd examples/rbac             # Role-based access control
cd examples/password-recovery # Password reset
```

### 4. Install Example Dependencies

```bash
npm install
```

### 5. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env  # or your preferred editor
```

**Minimum required settings:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=add_auth_examples
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 6. Start the Example

```bash
npm start
```

Each example runs on a different port:
- JWT Auth: `http://localhost:3000`
- Session Auth: `http://localhost:3001`
- OAuth Social: `http://localhost:3002`
- RBAC: `http://localhost:3003`
- Password Recovery: `http://localhost:3004`

## Example-Specific Setup

### JWT Authentication (Port 3000)

**Simplest example - start here!**

No additional setup required beyond the general steps above.

```bash
cd examples/jwt-auth
npm install
cp .env.example .env
# Edit .env with database credentials
npm start
```

**Test it:**
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

---

### Session Authentication (Port 3001)

**Requires Redis to be running.**

```bash
# Start Redis (if not already running)
# macOS
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis

# Or Docker
docker run -d -p 6379:6379 redis:7-alpine
```

Then:
```bash
cd examples/session-auth
npm install
cp .env.example .env
# Edit .env with database and Redis credentials
npm start
```

**Test it:**
```bash
# Register and save cookies
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"SecurePass123!","username":"testuser"}'

# Access protected route with session
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

---

### OAuth Social Login (Port 3002)

**Requires OAuth credentials and Redis.**

1. **Set up OAuth Applications:**

   **Google:**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create project and enable Google+ API
   - Create OAuth credentials
   - Add redirect URI: `http://localhost:3002/auth/google/callback`

   **GitHub:**
   - Visit [GitHub Developer Settings](https://github.com/settings/developers)
   - Register new OAuth app
   - Set callback: `http://localhost:3002/auth/github/callback`

2. **Configure and run:**
   ```bash
   cd examples/oauth-social
   npm install
   cp .env.example .env
   # Add OAuth credentials to .env
   npm start
   ```

3. **Test it:**
   Open browser and visit:
   - `http://localhost:3002/auth/google`
   - `http://localhost:3002/auth/github`

---

### RBAC - Role-Based Access Control (Port 3003)

**Includes role seeding script.**

```bash
cd examples/rbac
npm install
cp .env.example .env
# Edit .env
npm run seed  # Create default roles
npm start
```

**Test it:**
```bash
# Login as admin (created by seed)
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecureAdminPassword123!"}'

# Create a new role (admin only)
curl -X POST http://localhost:3003/api/roles \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"moderator","permissions":["content:read","content:update"]}'
```

---

### Password Recovery (Port 3004)

**Requires email service configuration.**

```bash
cd examples/password-recovery
npm install
cp .env.example .env
# Configure email settings in .env
npm start
```

**For testing, use Mailtrap:**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

**Test it:**
```bash
# Request password reset
curl -X POST http://localhost:3004/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check email for reset link
# Then reset password
curl -X POST http://localhost:3004/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"token-from-email","newPassword":"NewSecurePass123!"}'
```

## Running Multiple Examples

You can run multiple examples simultaneously since they use different ports:

```bash
# Terminal 1
cd examples/jwt-auth && npm start

# Terminal 2
cd examples/session-auth && npm start

# Terminal 3
cd examples/oauth-social && npm start
```

## Troubleshooting

### Database Connection Issues

**Error:** `Connection refused` or `database does not exist`

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Create database if it doesn't exist
createdb add_auth_examples

# Check credentials match .env file
psql -U postgres -d add_auth_examples
```

### Redis Connection Issues

**Error:** `Redis connection failed`

**Solution:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Docker: docker run -d -p 6379:6379 redis:7-alpine
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3005
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### OAuth Redirect URI Mismatch

**Error:** `redirect_uri_mismatch`

**Solution:**
- Ensure callback URLs in OAuth app settings match exactly
- Check for trailing slashes
- Verify http vs https

## Testing Tools

### cURL Commands

All examples include cURL commands in their READMEs for API testing.

### Postman

Import these collections for easier testing:
- [Postman Collection for JWT Auth](./jwt-auth/docs/postman-collection.json)
- [Postman Collection for Session Auth](./session-auth/docs/postman-collection.json)

### Browser Testing

For OAuth examples, open in browser:
- Google OAuth: `http://localhost:3002/auth/google`
- GitHub OAuth: `http://localhost:3002/auth/github`

## Next Steps

1. **Start with JWT Auth** - Simplest example, no dependencies
2. **Try Session Auth** - Learn session management
3. **Explore OAuth** - Integrate social login
4. **Study RBAC** - Add authorization to your app
5. **Implement Password Recovery** - Complete the auth flow

## Learning Resources

- [Main Project Documentation](../../README.md)
- [API Documentation](../../docs/API.md)
- [Security Best Practices](../../docs/SECURITY.md)
- [Deployment Guide](../../docs/DEPLOYMENT.md)

## Getting Help

- Check example's README for detailed information
- Review error messages carefully
- Check logs for detailed error information
- Open an issue on GitHub if you find bugs

## Contributing

Found an issue or want to improve an example?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT - Same as the main project
