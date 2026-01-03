const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const pool = require('../utils/db');

async function findUserByOAuth(provider, providerId) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name
     FROM users u
     JOIN oauth_accounts oa ON oa.user_id = u.id
     WHERE oa.provider = $1 AND oa.provider_id = $2`,
    [provider, providerId]
  );
  return result.rows[0] || null;
}

async function findUserByEmail(email) {
  const result = await pool.query('SELECT id, email, username, first_name, last_name FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
}

async function createUserFromOAuth({ email, provider, providerId, profile }) {
  const username = profile?.username || (email ? email.split('@')[0] : null);
  const firstName = profile?.firstName || null;
  const lastName = profile?.lastName || null;

  const userResult = await pool.query(
    `INSERT INTO users (email, status, email_verified, username, first_name, last_name, oauth_providers)
     VALUES ($1, 'active', TRUE, $2, $3, $4, $5)
     RETURNING id, email, username, first_name, last_name`,
    [email.toLowerCase(), username, firstName, lastName, JSON.stringify([provider])]
  );

  const user = userResult.rows[0];

  await pool.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_id, profile_data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_id) DO UPDATE SET profile_data = EXCLUDED.profile_data, updated_at = NOW()`,
    [user.id, provider, providerId, JSON.stringify(profile || {})]
  );

  return user;
}

async function linkOAuthAccount(userId, { provider, providerId, profile }) {
  await pool.query(
    `INSERT INTO oauth_accounts (user_id, provider, provider_id, profile_data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_id) DO UPDATE SET user_id = EXCLUDED.user_id, profile_data = EXCLUDED.profile_data, updated_at = NOW()`,
    [userId, provider, providerId, JSON.stringify(profile || {})]
  );

  // Update oauth_providers list on users
  await pool.query(
    `UPDATE users
     SET oauth_providers = (
       SELECT COALESCE(jsonb_agg(DISTINCT elem), '[]'::jsonb)
       FROM (
         SELECT jsonb_array_elements(COALESCE(oauth_providers::jsonb, '[]'::jsonb)) as elem
         UNION
         SELECT $2::jsonb as elem
       ) sub
     )
     WHERE id = $1`,
    [userId, JSON.stringify(provider)]
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, email, username, first_name, last_name FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});

function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/auth/google/callback',
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value;
            if (!email) return done(new Error('Google account did not provide an email'));

            const provider = 'google';
            const providerId = profile.id;
            const normalizedProfile = {
              provider,
              providerId,
              email,
              displayName: profile.displayName,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              avatarUrl: profile.photos?.[0]?.value
            };

            // If this request is for account linking, attach provider to current user
            if (req?.session?.linkUserId) {
              const linkUserId = req.session.linkUserId;
              delete req.session.linkUserId;
              await linkOAuthAccount(linkUserId, { provider, providerId, profile: normalizedProfile });
              const linked = await pool.query('SELECT id, email, username, first_name, last_name FROM users WHERE id = $1', [linkUserId]);
              return done(null, linked.rows[0] || null);
            }

            let user = await findUserByOAuth(provider, providerId);
            if (!user) {
              // Merge/link by email if user exists
              const existingByEmail = await findUserByEmail(email);
              if (existingByEmail) {
                await linkOAuthAccount(existingByEmail.id, { provider, providerId, profile: normalizedProfile });
                user = existingByEmail;
              } else {
                user = await createUserFromOAuth({ email, provider, providerId, profile: normalizedProfile });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3002/auth/github/callback',
          scope: ['user:email'],
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const email = profile?.emails?.[0]?.value;
            if (!email) return done(new Error('GitHub account did not provide an email (ensure scope user:email)'));

            const provider = 'github';
            const providerId = String(profile.id);
            const normalizedProfile = {
              provider,
              providerId,
              email,
              displayName: profile.displayName || profile.username,
              username: profile.username,
              avatarUrl: profile.photos?.[0]?.value
            };

            if (req?.session?.linkUserId) {
              const linkUserId = req.session.linkUserId;
              delete req.session.linkUserId;
              await linkOAuthAccount(linkUserId, { provider, providerId, profile: normalizedProfile });
              const linked = await pool.query('SELECT id, email, username, first_name, last_name FROM users WHERE id = $1', [linkUserId]);
              return done(null, linked.rows[0] || null);
            }

            let user = await findUserByOAuth(provider, providerId);
            if (!user) {
              const existingByEmail = await findUserByEmail(email);
              if (existingByEmail) {
                await linkOAuthAccount(existingByEmail.id, { provider, providerId, profile: normalizedProfile });
                user = existingByEmail;
              } else {
                user = await createUserFromOAuth({ email, provider, providerId, profile: normalizedProfile });
              }
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  return passport;
}

module.exports = { configurePassport };

