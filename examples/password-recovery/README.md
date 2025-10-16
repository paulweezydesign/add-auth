# Password Recovery Example

A secure implementation of password reset and recovery flow with email-based token verification.

## Overview

This example demonstrates:
- Forgot password request
- Email-based password reset tokens
- Secure token validation
- Password reset with new password
- Account recovery mechanisms
- Token expiration and rate limiting

## Features

- ✅ Forgot Password Request
- ✅ Email Reset Token Generation
- ✅ Secure Token Validation
- ✅ Password Reset
- ✅ Token Expiration (1 hour)
- ✅ Rate Limiting
- ✅ Account Lockout Protection
- ✅ Email Notifications

## Quick Start

1. **Configure email service:**
   - Set up SMTP credentials or use a service like SendGrid/Mailgun
   - Update `.env` with email configuration

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Configure email settings in .env
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

The server will start on `http://localhost:3004`

## Password Recovery Flow

```
1. User clicks "Forgot Password"
   ↓
2. User enters email address
   ↓
3. Server generates secure reset token
   ↓
4. Server sends email with reset link
   ↓
5. User clicks link in email
   ↓
6. User enters new password
   ↓
7. Server validates token and updates password
   ↓
8. User is notified of successful reset
```

## API Endpoints

### Request Password Reset

```bash
curl -X POST http://localhost:3004/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Email Sent:**
```
Subject: Password Reset Request

Hello,

You requested a password reset for your account.

Click the link below to reset your password:
http://localhost:3004/reset-password?token=abc123xyz...

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Your App Team
```

### Validate Reset Token

```bash
curl -X POST http://localhost:3004/api/auth/validate-reset-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz..."
  }'
```

**Response (Valid):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "email": "user@example.com"
  }
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "This password reset link is invalid or has expired."
}
```

### Reset Password

```bash
curl -X POST http://localhost:3004/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz...",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

### Change Password (Authenticated)

```bash
curl -X POST http://localhost:3004/api/auth/change-password \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewSecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## How It Works

### 1. Password Reset Token Generation

```javascript
// Generate cryptographically secure token
const resetToken = crypto.randomBytes(32).toString('hex');

// Hash token before storing (like password)
const hashedToken = await hashToken(resetToken);

// Store in database with expiration
await storeResetToken({
  userId,
  token: hashedToken,
  expiresAt: Date.now() + 3600000 // 1 hour
});

// Send original token via email
sendResetEmail(email, resetToken);
```

### 2. Token Validation

```javascript
// Hash received token
const hashedToken = hashToken(receivedToken);

// Find matching token in database
const tokenRecord = await findResetToken(hashedToken);

// Check expiration
if (tokenRecord.expiresAt < Date.now()) {
  throw new Error('Token expired');
}

// Token is valid
return tokenRecord.userId;
```

### 3. Password Reset

```javascript
// Validate token
const userId = await validateResetToken(token);

// Hash new password
const hashedPassword = await hashPassword(newPassword);

// Update user password
await updateUserPassword(userId, hashedPassword);

// Delete used token
await deleteResetToken(token);

// Send confirmation email
sendPasswordChangedEmail(user.email);
```

## Security Features

### Implemented Security

1. **Secure Token Generation:**
   - Cryptographically random tokens
   - 256-bit entropy
   - Hashed before storage

2. **Token Expiration:**
   - 1-hour validity (configurable)
   - Automatic cleanup of expired tokens

3. **One-Time Use:**
   - Tokens deleted after use
   - Cannot be reused

4. **Rate Limiting:**
   - Limit password reset requests
   - Prevent email flooding
   - Account-specific throttling

5. **Email Obfuscation:**
   - Generic success messages
   - Prevent user enumeration
   - No indication if email exists

6. **Account Lockout:**
   - Lock account after failed attempts
   - Require email verification to unlock

### Best Practices

- Always use HTTPS in production
- Implement rate limiting
- Log all password reset attempts
- Notify users of password changes
- Require strong passwords
- Add CAPTCHA for reset requests
- Monitor for suspicious patterns

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
PORT=3004
NODE_ENV=development
BASE_URL=http://localhost:3004

# JWT
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# Email Configuration
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Or use SendGrid
# EMAIL_SERVICE=sendgrid
# SENDGRID_API_KEY=your-sendgrid-api-key

# Password Reset
RESET_TOKEN_EXPIRY=3600000
RESET_TOKEN_LENGTH=32
MAX_RESET_ATTEMPTS=3
RESET_COOLDOWN=900000

# Security
BCRYPT_ROUNDS=12
```

## Email Templates

### Reset Password Email

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .button {
      background-color: #007bff;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>You requested a password reset for your account.</p>
    <p>Click the button below to reset your password:</p>
    <p>
      <a href="{{resetLink}}" class="button">Reset Password</a>
    </p>
    <p>Or copy this link:</p>
    <p>{{resetLink}}</p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>Your App Team</p>
  </div>
</body>
</html>
```

### Password Changed Email

```html
<!DOCTYPE html>
<html>
<body>
  <div class="container">
    <h2>Password Changed</h2>
    <p>Hello,</p>
    <p>Your password was successfully changed.</p>
    <p>If you didn't make this change, please contact support immediately.</p>
    <p>Time: {{timestamp}}</p>
    <p>IP Address: {{ipAddress}}</p>
    <p>Best regards,<br>Your App Team</p>
  </div>
</body>
</html>
```

## Database Schema

### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  used_at TIMESTAMP,
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

## Testing

### Manual Testing Flow

1. Request password reset
2. Check email for reset link
3. Click reset link
4. Enter new password
5. Verify password changed
6. Login with new password
7. Check confirmation email

### Test Email Integration

```bash
# Use a test email service like Mailtrap
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

### Test Token Expiration

```bash
# Set short expiration for testing
RESET_TOKEN_EXPIRY=300000  # 5 minutes

# Request reset
curl -X POST http://localhost:3004/api/auth/forgot-password \
  -d '{"email":"test@example.com"}'

# Wait 6 minutes
sleep 360

# Try to use token (should fail)
curl -X POST http://localhost:3004/api/auth/reset-password \
  -d '{"token":"...","newPassword":"NewPass123!"}'
```

## Common Issues

### Emails not sending
- Check SMTP credentials
- Verify firewall settings
- Check spam folder
- Test with Mailtrap or similar service

### Token always invalid
- Check token hashing consistency
- Verify database storage
- Check expiration time calculation

### Rate limiting too strict
- Adjust rate limit settings
- Check IP detection
- Verify cooldown period

## Extending This Example

### Add Features

1. **Account Recovery Questions:**
   - Security questions
   - Multi-factor verification
   - Alternative recovery methods

2. **SMS Recovery:**
   - Send reset code via SMS
   - Phone number verification
   - Two-factor authentication

3. **Account Lockout:**
   - Temporary account suspension
   - Admin unlock required
   - Notification to user

4. **Password History:**
   - Prevent password reuse
   - Track password changes
   - Enforce rotation policies

## Related Examples

- **JWT Auth:** For authentication after reset
- **Session Auth:** For session-based password change
- **OAuth Social:** For alternative login methods
- **RBAC:** For admin password reset capabilities

## References

- [OWASP Password Reset Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [Nodemailer](https://nodemailer.com/) - Email sending library
- [SendGrid](https://sendgrid.com/) - Email delivery service

## License

MIT
