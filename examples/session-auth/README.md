# Session-Based Authentication Example

A complete implementation of traditional session-based authentication using Express sessions with Redis storage.

## Overview

This example demonstrates:
- Cookie-based session management
- Redis session store for scalability
- Session fingerprinting for security
- "Remember me" functionality
- Session lifecycle management
- Active session listing and revocation

## Features

- ✅ Cookie-based Sessions
- ✅ Redis Session Store
- ✅ Session Fingerprinting (IP + User-Agent)
- ✅ Remember Me Functionality
- ✅ Session Management (List/Revoke)
- ✅ Automatic Session Cleanup
- ✅ CSRF Protection
- ✅ Secure Cookie Configuration

## Quick Start

1. **Ensure Redis is running:**
   ```bash
   # Install Redis (if not already installed)
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   # From the main project directory
   npm run migrate
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "username": "johndoe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    },
    "sessionId": "sess:abc123..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "rememberMe": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    },
    "sessionId": "sess:abc123..."
  }
}
```

### Access Protected Route

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    },
    "session": {
      "id": "sess:abc123...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": "2024-01-08T00:00:00.000Z"
    }
  }
}
```

### Get Active Sessions

```bash
curl -X GET http://localhost:3001/api/auth/sessions \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "sess:abc123...",
        "ipAddress": "127.0.0.1",
        "userAgent": "curl/7.79.1",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastActivity": "2024-01-01T00:10:00.000Z",
        "isCurrent": true
      }
    ]
  }
}
```

### Revoke a Session

```bash
curl -X DELETE http://localhost:3001/api/auth/sessions/sess:xyz789 \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## How It Works

### 1. Session Creation

1. User logs in with credentials
2. Server validates credentials
3. Session is created and stored in Redis
4. Session ID is sent as HTTP-only cookie
5. Session fingerprint is generated (IP + User-Agent)

### 2. Session Validation

1. Client sends cookie with each request
2. Server extracts session ID from cookie
3. Session is retrieved from Redis
4. Fingerprint is validated against current request
5. Request proceeds if session is valid

### 3. Session Expiration

- **Default:** 24 hours
- **Remember Me:** 7 days
- Sessions auto-expire in Redis
- Expired sessions are automatically cleaned up

### 4. Session Security

- **HTTP-only cookies** prevent XSS attacks
- **Secure flag** in production (HTTPS only)
- **SameSite** protection against CSRF
- **Fingerprinting** detects session hijacking
- **IP validation** (optional, configurable)

## Session Configuration

### Cookie Options

```javascript
{
  httpOnly: true,           // Prevent JavaScript access
  secure: true,             // HTTPS only (production)
  sameSite: 'strict',       // CSRF protection
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'                 // Available site-wide
}
```

### Redis Configuration

```javascript
{
  host: 'localhost',
  port: 6379,
  db: 0,
  keyPrefix: 'sess:',
  ttl: 86400               // 24 hours in seconds
}
```

## Security Features

### Implemented Security

1. **Session Fingerprinting:**
   - IP address tracking
   - User-Agent validation
   - Detects session hijacking attempts

2. **Secure Cookies:**
   - HTTP-only flag
   - Secure flag (HTTPS)
   - SameSite protection

3. **Session Management:**
   - List all active sessions
   - Revoke individual sessions
   - Logout from all devices

4. **Automatic Cleanup:**
   - Sessions expire automatically
   - Redis TTL management
   - Old sessions are purged

### Best Practices

- Use HTTPS in production
- Enable Redis persistence
- Implement rate limiting
- Add CSRF tokens for state-changing operations
- Monitor suspicious session patterns
- Implement session fixation protection

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://localhost:5432/add_auth_examples
DB_HOST=localhost
DB_PORT=5432
DB_NAME=add_auth_examples
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3001
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters
SESSION_TIMEOUT=86400000
SESSION_REMEMBER_ME_TIMEOUT=604800000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=sess:

# Security
BCRYPT_ROUNDS=12
COOKIE_SECURE=false
```

## Project Structure

```
session-auth/
├── README.md
├── .env.example
├── package.json
├── src/
│   ├── app.js              # Express app setup
│   ├── index.js            # Server entry point
│   ├── routes/
│   │   └── auth.js         # Authentication routes
│   ├── middleware/
│   │   ├── session.js      # Session validation
│   │   └── validation.js   # Input validation
│   └── utils/
│       ├── db.js           # Database connection
│       ├── redis.js        # Redis client
│       ├── password.js     # Password utilities
│       └── fingerprint.js  # Session fingerprinting
└── docs/
    └── API.md             # Detailed API documentation
```

## Redis Storage Format

Sessions are stored in Redis with this structure:

```
Key: sess:abc123...
Value: {
  userId: "uuid",
  email: "user@example.com",
  fingerprint: {
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0..."
  },
  createdAt: 1234567890,
  lastActivity: 1234567890,
  rememberMe: false
}
TTL: 86400 seconds
```

## Testing

### Manual Testing Flow

1. Register a new user
2. Login with credentials
3. Access protected routes
4. List active sessions
5. Create multiple sessions (different browsers/devices)
6. Revoke a specific session
7. Test session expiration
8. Test "remember me" functionality

### Testing Session Fingerprinting

```bash
# Login from one location
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Browser-A" \
  -c cookies.txt \
  -d '{"email": "user@example.com", "password": "SecurePassword123!"}'

# Try to use same session with different User-Agent (should fail)
curl -X GET http://localhost:3001/api/auth/me \
  -H "User-Agent: Browser-B" \
  -b cookies.txt
```

## Common Issues

### Redis connection error
- Ensure Redis server is running: `redis-cli ping`
- Check Redis host and port configuration
- Verify firewall settings

### Session not persisting
- Check cookie settings (secure flag in development)
- Verify Redis connection
- Check session secret is set

### "Session expired" immediately
- Check system time/timezone
- Verify Redis TTL configuration
- Check session timeout values

## Scaling Considerations

### High Availability

1. **Redis Cluster:**
   - Use Redis Sentinel or Redis Cluster
   - Configure failover
   - Enable persistence (RDB/AOF)

2. **Session Replication:**
   - Multiple Redis instances
   - Read replicas for scaling
   - Consistent hashing

3. **Load Balancing:**
   - Sticky sessions not required
   - Any server can validate any session
   - Session data in shared Redis

## Related Examples

- **JWT Auth:** For stateless authentication
- **OAuth Social:** For social login with sessions
- **RBAC:** For role-based access control with sessions
- **Password Recovery:** For password reset functionality

## References

- [Express Session](https://www.npmjs.com/package/express-session)
- [Connect Redis](https://www.npmjs.com/package/connect-redis)
- [Redis](https://redis.io/docs/)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## License

MIT
