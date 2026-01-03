import express from 'express';
import passport from 'passport';

const router = express.Router();

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3002';
const SUCCESS_REDIRECT = process.env.SUCCESS_REDIRECT ?? '/';
const FAILURE_REDIRECT = process.env.FAILURE_REDIRECT ?? '/?error=auth_failed';

/**
 * Middleware to ensure user is authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect(FAILURE_REDIRECT);
};

// ==================== Google OAuth ====================

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: FAILURE_REDIRECT,
    failureMessage: true,
  }),
  (_req, res) => {
    res.redirect(SUCCESS_REDIRECT);
  }
);

/**
 * GET /auth/link/google
 * Link Google account to existing user
 */
router.get('/link/google', ensureAuthenticated, passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// ==================== GitHub OAuth ====================

/**
 * GET /auth/github
 * Initiate GitHub OAuth flow
 */
router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
}));

/**
 * GET /auth/github/callback
 * GitHub OAuth callback
 */
router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: FAILURE_REDIRECT,
    failureMessage: true,
  }),
  (_req, res) => {
    res.redirect(SUCCESS_REDIRECT);
  }
);

/**
 * GET /auth/link/github
 * Link GitHub account to existing user
 */
router.get('/link/github', ensureAuthenticated, passport.authenticate('github', {
  scope: ['user:email'],
}));

// ==================== Session Management ====================

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', ensureAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
      },
    },
  });
});

/**
 * POST /auth/logout
 * Logout current user
 */
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('Session destruction error:', sessionErr);
      }
      res.clearCookie('sessionId');
      res.json({
        success: true,
        message: 'Logout successful',
      });
    });
  });
});

export default router;
