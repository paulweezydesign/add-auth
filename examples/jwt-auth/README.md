# JWT Authentication Example

A complete implementation of JWT (JSON Web Token) based authentication with user registration, login, and protected routes.

## Overview

This example demonstrates:
- User registration with password hashing
- User login with JWT token generation
- Access token and refresh token mechanism
- Protected routes requiring authentication
- Token validation middleware
- Token refresh endpoint

## Features

- ✅ User Registration
- ✅ User Login
- ✅ JWT Access Tokens (short-lived)
- ✅ JWT Refresh Tokens (long-lived)
- ✅ Token Refresh Mechanism
- ✅ Protected Routes
- ✅ Password Hashing (bcrypt)
- ✅ Input Validation
- ✅ Error Handling

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database migrations:**
   ```bash
   # From the main project directory
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
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
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
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
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Access Protected Route

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## How It Works

### 1. User Registration Flow

1. Client sends registration request with email, password, and username
2. Server validates input data
3. Password is hashed using bcrypt
4. User is created in database
5. JWT tokens (access + refresh) are generated
6. Tokens are returned to client

### 2. Login Flow

1. Client sends login credentials
2. Server validates email and password
3. Password is compared with hashed password in database
4. JWT tokens are generated upon successful authentication
5. Tokens are returned to client

### 3. Protected Route Access

1. Client includes access token in Authorization header
2. Middleware validates the token
3. User information is extracted from token
4. Request proceeds if token is valid
5. 401 error returned if token is invalid or expired

### 4. Token Refresh Flow

1. Client sends expired access token and valid refresh token
2. Server validates refresh token
3. New access token is generated
4. New refresh token is generated (token rotation)
5. New tokens are returned to client

## Token Details

### Access Token
- **Purpose:** Authenticate API requests
- **Expiration:** 15 minutes (configurable)
- **Storage:** Client-side (memory or secure storage)
- **Contains:** User ID, email, token type

### Refresh Token
- **Purpose:** Obtain new access tokens
- **Expiration:** 7 days (configurable)
- **Storage:** Secure HTTP-only cookie (recommended) or secure client storage
- **Contains:** User ID, token type

## Security Considerations

### Implemented Security Features

1. **Password Hashing:** bcrypt with configurable salt rounds
2. **Token Expiration:** Short-lived access tokens, longer refresh tokens
3. **Token Rotation:** New refresh token on each refresh
4. **Input Validation:** All inputs validated before processing
5. **Error Messages:** Generic messages to prevent user enumeration
6. **HTTPS Required:** (in production)

### Best Practices

- Store refresh tokens securely (HTTP-only cookies recommended)
- Use HTTPS in production
- Implement rate limiting for auth endpoints
- Add token blacklisting for logout
- Monitor for suspicious login patterns
- Implement account lockout after failed attempts

## Environment Variables

Create a `.env` file with these variables:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/add_auth_examples
DB_HOST=localhost
DB_PORT=5432
DB_NAME=add_auth_examples
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
```

## Project Structure

```
jwt-auth/
├── README.md
├── .env.example
├── package.json
├── src/
│   ├── app.js              # Express app setup
│   ├── index.js            # Server entry point
│   ├── routes/
│   │   └── auth.js         # Authentication routes
│   ├── middleware/
│   │   ├── auth.js         # JWT validation middleware
│   │   └── validation.js   # Input validation
│   └── utils/
│       ├── jwt.js          # JWT utility functions
│       └── password.js     # Password hashing utilities
└── docs/
    └── API.md             # Detailed API documentation
```

## Testing

### Manual Testing

Use the curl commands provided above or import the Postman collection.

### Testing Flow

1. Register a new user
2. Login with the credentials
3. Access a protected route with the token
4. Wait for token to expire (or modify expiration for testing)
5. Use refresh token to get new access token
6. Logout to invalidate tokens

## Common Issues

### "Invalid token" error
- Check if token has expired
- Verify token is properly formatted in Authorization header
- Ensure JWT_SECRET matches between token generation and validation

### "User already exists" on registration
- Email must be unique
- Try a different email address

### Database connection error
- Verify PostgreSQL is running
- Check database credentials in .env
- Ensure database exists

## Extending This Example

### Add Features

1. **Email Verification:**
   - Generate verification token on registration
   - Send verification email
   - Verify email before allowing login

2. **Two-Factor Authentication:**
   - Implement TOTP (Time-based One-Time Password)
   - Add 2FA setup and verification endpoints

3. **Account Lockout:**
   - Track failed login attempts
   - Lock account after threshold
   - Add unlock mechanism

4. **Token Blacklist:**
   - Store invalidated tokens in Redis
   - Check blacklist on token validation
   - Expire blacklist entries automatically

## Related Examples

- **Session Auth:** For traditional session-based authentication
- **OAuth Social:** For social login integration
- **Password Recovery:** For forgot/reset password functionality
- **RBAC:** For role-based access control

## References

- [JWT.io](https://jwt.io/) - JWT token debugger and documentation
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing library

## License

MIT
