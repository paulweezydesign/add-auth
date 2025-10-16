# OAuth Social Login Example

A complete implementation of OAuth 2.0 social authentication with Google and GitHub providers.

## Overview

This example demonstrates:
- Google OAuth 2.0 authentication
- GitHub OAuth 2.0 authentication
- OAuth account linking for existing users
- Profile synchronization
- Multiple provider support
- OAuth account management

## Features

- ✅ Google OAuth Login
- ✅ GitHub OAuth Login  
- ✅ Account Linking (connect multiple providers)
- ✅ Account Unlinking
- ✅ Profile Synchronization
- ✅ OAuth Token Management
- ✅ Email Verification from OAuth

## Quick Start

1. **Set up OAuth Applications:**

   **Google:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3002/auth/google/callback`

   **GitHub:**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Register a new OAuth application
   - Set callback URL: `http://localhost:3002/auth/github/callback`

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Add your OAuth credentials to .env
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

The server will start on `http://localhost:3002`

## OAuth Flow

### Google Login Flow

```
1. User clicks "Login with Google"
   ↓
2. Redirect to Google: http://localhost:3002/auth/google
   ↓
3. User authorizes on Google
   ↓
4. Google redirects to: http://localhost:3002/auth/google/callback
   ↓
5. Server creates/updates user and creates session
   ↓
6. User is redirected to dashboard
```

### GitHub Login Flow

```
1. User clicks "Login with GitHub"
   ↓
2. Redirect to GitHub: http://localhost:3002/auth/github
   ↓
3. User authorizes on GitHub
   ↓
4. GitHub redirects to: http://localhost:3002/auth/github/callback
   ↓
5. Server creates/updates user and creates session
   ↓
6. User is redirected to dashboard
```

## API Endpoints

### Initiate Google OAuth

```bash
# Visit in browser or redirect
http://localhost:3002/auth/google
```

### Initiate GitHub OAuth

```bash
# Visit in browser or redirect
http://localhost:3002/auth/github
```

### Get OAuth Accounts (Authenticated)

```bash
curl -X GET http://localhost:3002/api/oauth/accounts \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "provider": "google",
        "providerId": "1234567890",
        "email": "user@gmail.com",
        "displayName": "John Doe",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "provider": "github",
        "providerId": "octocat",
        "email": "user@github.com",
        "displayName": "octocat",
        "createdAt": "2024-01-02T00:00:00.000Z"
      }
    ]
  }
}
```

### Link Additional OAuth Account

```bash
# Must be authenticated
# Visit in browser while logged in
http://localhost:3002/auth/link/google
http://localhost:3002/auth/link/github
```

### Unlink OAuth Account

```bash
curl -X DELETE http://localhost:3002/api/oauth/unlink/google \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "OAuth account unlinked successfully"
}
```

### Logout

```bash
curl -X POST http://localhost:3002/auth/logout \
  -b cookies.txt
```

## How It Works

### 1. OAuth Registration Flow

1. User initiates OAuth (clicks "Login with Google/GitHub")
2. Server redirects to OAuth provider
3. User authenticates with provider
4. Provider redirects back with authorization code
5. Server exchanges code for access token
6. Server fetches user profile from provider
7. Server creates user account (if new) or updates existing
8. Server creates session and logs user in

### 2. Account Linking Flow

1. Authenticated user initiates account linking
2. OAuth flow proceeds normally
3. OAuth account is linked to existing user account
4. User can now login with either provider

### 3. Profile Synchronization

- Email address from OAuth profile
- Display name from OAuth profile
- Avatar URL (if available)
- Profile metadata stored for reference

## OAuth Provider Configuration

### Google OAuth

**Scopes Requested:**
- `profile` - Basic profile information
- `email` - Email address

**Data Retrieved:**
- User ID (sub)
- Email address
- Name
- Profile picture URL

### GitHub OAuth

**Scopes Requested:**
- `user:email` - Email addresses

**Data Retrieved:**
- User ID
- Username
- Email address  
- Name
- Avatar URL

## Security Considerations

### Implemented Security

1. **State Parameter:**
   - CSRF protection during OAuth flow
   - Random state generated per request

2. **Token Storage:**
   - Access tokens stored securely
   - Refresh tokens encrypted (if applicable)

3. **Email Verification:**
   - OAuth providers verify email ownership
   - Trusted email addresses from OAuth

4. **Session Security:**
   - HTTP-only cookies
   - Secure flag in production
   - Session fingerprinting

### Best Practices

- Use HTTPS in production
- Validate redirect URIs
- Store OAuth tokens securely
- Implement scope minimization
- Monitor OAuth token usage
- Regular security audits

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
PORT=3002
NODE_ENV=development
BASE_URL=http://localhost:3002

# Session
SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3002/auth/github/callback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
BCRYPT_ROUNDS=12
```

## Project Structure

```
oauth-social/
├── README.md
├── .env.example
├── package.json
├── src/
│   ├── app.js              # Express app setup
│   ├── index.js            # Server entry point
│   ├── routes/
│   │   ├── auth.js         # OAuth routes
│   │   └── oauth.js        # OAuth management
│   ├── config/
│   │   └── passport.js     # Passport OAuth strategies
│   └── utils/
│       ├── db.js           # Database connection
│       ├── redis.js        # Redis client
│       └── session.js      # Session utilities
├── docs/
│   └── SETUP.md           # OAuth setup guide
└── public/
    └── index.html         # Login page with OAuth buttons
```

## OAuth Setup Guides

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI:
   - Development: `http://localhost:3002/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: Your App Name
   - Homepage URL: `http://localhost:3002`
   - Authorization callback URL: `http://localhost:3002/auth/github/callback`
4. Click "Register application"
5. Copy Client ID and generate Client Secret
6. Add credentials to `.env`

## Testing

### Manual Testing Flow

1. Start the server
2. Visit `http://localhost:3002`
3. Click "Login with Google" or "Login with GitHub"
4. Complete OAuth authorization
5. Verify user is logged in
6. Test account linking (login with one provider, link another)
7. Test account unlinking
8. Logout and login with different provider

### Testing with Multiple Accounts

```bash
# Login with Google
1. Visit http://localhost:3002/auth/google
2. Complete Google OAuth
3. Note session cookie

# Link GitHub account
4. Visit http://localhost:3002/auth/link/github
5. Complete GitHub OAuth
6. Verify both accounts are linked

# Unlink Google
7. POST to /api/oauth/unlink/google
8. Verify Google account is unlinked
```

## Common Issues

### "Redirect URI mismatch" error
- Verify callback URLs match exactly in OAuth app settings
- Check for trailing slashes
- Ensure protocol matches (http vs https)

### "Invalid client" error
- Verify Client ID and Client Secret are correct
- Check environment variables are loaded
- Ensure OAuth app is enabled

### Email not returned from OAuth
- Check OAuth scopes requested
- Verify user granted email permission
- Some providers require email scope explicitly

### Session not persisting
- Check Redis connection
- Verify session secret is set
- Check cookie settings

## Account Merging

If a user registers with email/password and later uses OAuth:

1. **Email Match:** If OAuth email matches existing user, accounts can be linked
2. **Manual Linking:** User must be logged in to link additional OAuth accounts
3. **Conflict Resolution:** Prevent duplicate accounts with same email

## Extending This Example

### Add More Providers

1. Install provider passport strategy
2. Configure provider credentials
3. Add provider routes
4. Update passport configuration
5. Add provider UI buttons

**Supported Passport Strategies:**
- Facebook (passport-facebook)
- Twitter (passport-twitter)
- LinkedIn (passport-linkedin-oauth2)
- Microsoft (passport-microsoft)
- Apple (passport-apple)

### Add Token Refresh

```javascript
// Store refresh token
user.googleRefreshToken = tokens.refresh_token;

// Refresh access token when expired
const newTokens = await refreshGoogleToken(user.googleRefreshToken);
```

### Add Profile Sync

```javascript
// Periodically sync profile data
async function syncGoogleProfile(userId) {
  const tokens = await getStoredTokens(userId);
  const profile = await fetchGoogleProfile(tokens.access_token);
  await updateUserProfile(userId, profile);
}
```

## Related Examples

- **JWT Auth:** For token-based authentication
- **Session Auth:** For session management without OAuth
- **RBAC:** For role-based access control
- **Password Recovery:** For traditional password reset

## References

- [Passport.js](http://www.passportjs.org/) - Authentication middleware
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)

## License

MIT
