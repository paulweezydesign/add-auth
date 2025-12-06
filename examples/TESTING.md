# Examples Testing Guide

This guide provides testing instructions for each authentication example.

## Prerequisites

Before testing, ensure:
- PostgreSQL database is set up
- Redis is running (for session-auth and oauth-social)
- All environment variables are configured
- Database migrations have been run

## JWT Authentication Testing

### Setup

```bash
cd examples/jwt-auth
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
```

### Test Flow

#### 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "username": "johndoe"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "username": "johndoe"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Save the tokens:**
```bash
export ACCESS_TOKEN="<access-token-from-response>"
export REFRESH_TOKEN="<refresh-token-from-response>"
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Access Protected Route

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "john@example.com",
      "username": "johndoe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 4. Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

#### 5. Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Error Cases to Test

#### Invalid Password (Registration)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "username": "testuser"
  }'
```

**Expected:** 400 error with password requirements

#### Duplicate Email

```bash
# Register same email twice
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "username": "anotherjohn"
  }'
```

**Expected:** 409 error "User already exists"

#### Invalid Credentials (Login)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword123!"
  }'
```

**Expected:** 401 error "Invalid credentials"

#### Expired/Invalid Token

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid-token"
```

**Expected:** 401 error "Invalid token"

---

## Session Authentication Testing

### Setup

```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine

cd examples/session-auth
npm install
cp .env.example .env
npm start
```

### Test Flow

#### 1. Register with Session Cookie

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "username": "janedoe"
  }'
```

**Note:** `-c cookies.txt` saves the session cookie

#### 2. Access Protected Route with Cookie

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

**Note:** `-b cookies.txt` sends the saved cookie

#### 3. Get Active Sessions

```bash
curl -X GET http://localhost:3001/api/auth/sessions \
  -b cookies.txt
```

#### 4. Logout (Destroys Session)

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
```

### Test Session Features

#### Remember Me

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "rememberMe": true
  }'
```

**Result:** Session lasts 7 days instead of 24 hours

#### Multiple Sessions

```bash
# Create first session
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c session1.txt \
  -d '{"email":"jane@example.com","password":"SecurePass123!"}'

# Create second session (simulating another browser)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c session2.txt \
  -d '{"email":"jane@example.com","password":"SecurePass123!"}'

# List all sessions
curl -X GET http://localhost:3001/api/auth/sessions \
  -b session1.txt
```

---

## OAuth Social Login Testing

### Setup OAuth Providers

1. **Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth credentials
   - Add redirect URI: `http://localhost:3002/auth/google/callback`
   - Copy Client ID and Secret to `.env`

2. **GitHub OAuth:**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Register OAuth app
   - Set callback: `http://localhost:3002/auth/github/callback`
   - Copy Client ID and Secret to `.env`

```bash
cd examples/oauth-social
npm install
cp .env.example .env
# Add OAuth credentials to .env
npm start
```

### Test Flow

#### 1. Test Google OAuth (Browser)

1. Open browser to: `http://localhost:3002/auth/google`
2. Login with Google account
3. Authorize the application
4. You should be redirected to dashboard
5. Session cookie is set

#### 2. Test GitHub OAuth (Browser)

1. Open browser to: `http://localhost:3002/auth/github`
2. Login with GitHub account
3. Authorize the application
4. You should be redirected to dashboard
5. Session cookie is set

#### 3. Get OAuth Accounts (cURL)

```bash
# After logging in via browser, use the session cookie
curl -X GET http://localhost:3002/api/oauth/accounts \
  -b cookies.txt
```

#### 4. Account Linking

1. Login with Google first
2. While logged in, visit: `http://localhost:3002/auth/link/github`
3. Authorize GitHub
4. Now both accounts are linked to the same user

#### 5. Unlink Account

```bash
curl -X DELETE http://localhost:3002/api/oauth/unlink/google \
  -b cookies.txt
```

---

## RBAC Testing

### Setup

```bash
cd examples/rbac
npm install
cp .env.example .env
npm run seed  # Creates default roles and admin user
npm start
```

### Test Flow

#### 1. Login as Admin

```bash
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecureAdminPassword123!"
  }'
```

**Save the admin token:**
```bash
export ADMIN_TOKEN="<token-from-response>"
```

#### 2. Create a New Role

```bash
curl -X POST http://localhost:3003/api/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moderator",
    "description": "Content moderator",
    "permissions": ["content:read", "content:update", "users:read"]
  }'
```

#### 3. List All Roles

```bash
curl -X GET http://localhost:3003/api/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 4. Assign Role to User

```bash
# First, register a regular user
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "username": "regularuser"
  }'

# Then assign role (as admin)
curl -X POST http://localhost:3003/api/roles/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "roleId": "<role-id>"
  }'
```

#### 5. Test Permission Check

```bash
# Login as regular user
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'

export USER_TOKEN="<token-from-response>"

# Try to access admin-only route (should fail)
curl -X POST http://localhost:3003/api/roles \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","permissions":[]}'
```

**Expected:** 403 Forbidden

---

## Password Recovery Testing

### Setup Email Service

```bash
cd examples/password-recovery
npm install
cp .env.example .env
# Configure email settings in .env
npm start
```

**For testing, use Mailtrap.io:**
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

### Test Flow

#### 1. Register a User

```bash
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "OldPassword123!",
    "username": "testuser"
  }'
```

#### 2. Request Password Reset

```bash
curl -X POST http://localhost:3004/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Result:** Email sent to Mailtrap inbox

#### 3. Check Email for Reset Token

- Login to Mailtrap
- Find the reset email
- Copy the token from the URL

#### 4. Validate Reset Token

```bash
export RESET_TOKEN="<token-from-email>"

curl -X POST http://localhost:3004/api/auth/validate-reset-token \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$RESET_TOKEN\"}"
```

#### 5. Reset Password

```bash
curl -X POST http://localhost:3004/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$RESET_TOKEN\",
    \"newPassword\": \"NewSecurePass123!\"
  }"
```

#### 6. Login with New Password

```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewSecurePass123!"
  }'
```

---

## Automated Testing Script

Save this as `test-all-examples.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Testing All Authentication Examples"
echo "===================================="

# Test JWT Auth
echo -e "\n${GREEN}Testing JWT Auth...${NC}"
cd examples/jwt-auth
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test-jwt@example.com","password":"SecurePass123!","username":"testjwt"}')

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ JWT Auth working${NC}"
else
  echo -e "${RED}✗ JWT Auth failed${NC}"
fi

# Test Session Auth
echo -e "\n${GREEN}Testing Session Auth...${NC}"
cd ../session-auth
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -c /tmp/session-cookies.txt \
  -d '{"email":"test-session@example.com","password":"SecurePass123!","username":"testsession"}')

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Session Auth working${NC}"
else
  echo -e "${RED}✗ Session Auth failed${NC}"
fi

# More tests...
echo -e "\n${GREEN}All tests completed${NC}"
```

Make it executable:
```bash
chmod +x test-all-examples.sh
./test-all-examples.sh
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep add_auth_examples

# Test connection
psql -U postgres -d add_auth_examples -c "SELECT NOW();"
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Check Redis connection
redis-cli
> KEYS sess:*
> exit
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Clear Test Data

```bash
# Clear users table
psql -U postgres -d add_auth_examples -c "TRUNCATE users CASCADE;"

# Clear Redis sessions
redis-cli FLUSHDB
```

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Test registration endpoint
ab -n 100 -c 10 -p register.json -T application/json \
  http://localhost:3000/api/auth/register

# register.json:
# {"email":"load-test@example.com","password":"SecurePass123!","username":"loadtest"}
```

### Load Testing with wrk

```bash
# Install wrk
# macOS: brew install wrk
# Ubuntu: git clone https://github.com/wg/wrk && cd wrk && make

# Test login endpoint
wrk -t4 -c100 -d30s \
  -s login.lua \
  http://localhost:3000/api/auth/login

# login.lua:
# wrk.method = "POST"
# wrk.body = '{"email":"test@example.com","password":"SecurePass123!"}'
# wrk.headers["Content-Type"] = "application/json"
```

---

## CI/CD Testing

### GitHub Actions Example

```yaml
name: Test Examples
on: [push, pull_request]

jobs:
  test-jwt-auth:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd examples/jwt-auth && npm install
      - name: Run tests
        run: cd examples/jwt-auth && npm test
```

---

## Conclusion

This testing guide provides comprehensive test scenarios for all authentication examples. Use these tests to verify functionality, learn the APIs, and ensure everything is working correctly.

For more details, see each example's README file.
