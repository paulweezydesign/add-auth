import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import pool from '../utils/db.js';

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, status FROM users WHERE id = $1',
      [id]
    );
    done(null, result.rows[0] ?? null);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Find or create user from OAuth profile
 */
const findOrCreateUser = async (profile, provider) => {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  const providerId = profile.id;
  const displayName = profile.displayName ?? profile.username ?? email?.split('@')[0];
  const avatarUrl = profile.photos?.[0]?.value ?? null;

  // Check if OAuth account already exists
  const existingOAuthResult = await pool.query(
    'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_id = $2',
    [provider, providerId]
  );

  if (existingOAuthResult.rows.length > 0) {
    // User exists with this OAuth account - fetch and return user
    const userResult = await pool.query(
      'SELECT id, email, username, status FROM users WHERE id = $1',
      [existingOAuthResult.rows[0].user_id]
    );
    return userResult.rows[0];
  }

  // Check if user exists with this email
  let user = null;
  if (email) {
    const existingUserResult = await pool.query(
      'SELECT id, email, username, status FROM users WHERE email = $1',
      [email]
    );
    user = existingUserResult.rows[0];
  }

  // Create new user if not exists
  if (!user) {
    const createUserResult = await pool.query(
      `INSERT INTO users (email, username, status) 
       VALUES ($1, $2, 'active') 
       RETURNING id, email, username, status`,
      [email, displayName]
    );
    user = createUserResult.rows[0];
  }

  // Link OAuth account to user
  await pool.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_id, email, display_name, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider, provider_id) DO UPDATE SET
       email = EXCLUDED.email,
       display_name = EXCLUDED.display_name,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()`,
    [user.id, provider, providerId, email, displayName, avatarUrl]
  );

  return user;
};

/**
 * Link OAuth account to existing user
 */
const linkOAuthAccount = async (userId, profile, provider) => {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  const providerId = profile.id;
  const displayName = profile.displayName ?? profile.username ?? email?.split('@')[0];
  const avatarUrl = profile.photos?.[0]?.value ?? null;

  // Check if this OAuth account is already linked to another user
  const existingResult = await pool.query(
    'SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_id = $2',
    [provider, providerId]
  );

  if (existingResult.rows.length > 0 && existingResult.rows[0].user_id !== userId) {
    throw new Error('This OAuth account is already linked to another user');
  }

  // Link OAuth account to user
  await pool.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_id, email, display_name, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider, provider_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       email = EXCLUDED.email,
       display_name = EXCLUDED.display_name,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()`,
    [userId, provider, providerId, email, displayName, avatarUrl]
  );

  // Fetch and return user
  const userResult = await pool.query(
    'SELECT id, email, username, status FROM users WHERE id = $1',
    [userId]
  );
  return userResult.rows[0];
};

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '/auth/google/callback',
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        let user;
        if (req.user) {
          // Linking account to existing user
          user = await linkOAuthAccount(req.user.id, profile, 'google');
        } else {
          // Login/Registration
          user = await findOrCreateUser(profile, 'google');
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  ));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL ?? '/auth/github/callback',
      scope: ['user:email'],
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        let user;
        if (req.user) {
          // Linking account to existing user
          user = await linkOAuthAccount(req.user.id, profile, 'github');
        } else {
          // Login/Registration
          user = await findOrCreateUser(profile, 'github');
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  ));
}

export default passport;
