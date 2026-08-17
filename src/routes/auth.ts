/**
 * Authentication Routes
 * Core authentication API endpoints with comprehensive security
 */

import { Router } from 'express';
import {
  rateLimiters,
  csrfProtection,
  validateBody,
  validationSchemas,
  securityMiddleware,
} from '../middleware';
import { authenticate } from '../middleware/authenticate';
import { sessionSecurityMiddleware } from '../middleware/session';
import {
  register,
  login,
  logout,
  refresh,
  getUserInfo,
  updateProfile,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  extendSession,
  changePassword,
} from '../controllers/auth';

const router = Router();

router.use(securityMiddleware.auth);

router.post(
  '/register',
  rateLimiters.registration,
  validateBody(validationSchemas.userRegistration),
  register
);

router.post(
  '/login',
  rateLimiters.login,
  validateBody(validationSchemas.userLogin),
  login
);

router.post(
  '/logout',
  authenticate(),
  csrfProtection(),
  logout
);

router.post(
  '/refresh',
  rateLimiters.refresh,
  validateBody(validationSchemas.refreshToken),
  refresh
);

router.get(
  '/me',
  authenticate(),
  securityMiddleware.basic,
  getUserInfo
);

router.put(
  '/profile',
  authenticate(),
  validateBody(validationSchemas.userProfileUpdate),
  csrfProtection(),
  updateProfile
);

router.post(
  '/change-password',
  authenticate(),
  validateBody(validationSchemas.passwordChange),
  csrfProtection(),
  changePassword
);

router.get(
  '/csrf-token',
  csrfProtection(),
  (_req, res) => {
    res.json({
      success: true,
      csrfToken: res.locals.csrfToken,
    });
  }
);

router.get(
  '/sessions',
  authenticate({ requireSession: true }),
  sessionSecurityMiddleware,
  getUserSessions
);

router.delete(
  '/sessions/:sessionId',
  authenticate({ requireSession: true }),
  sessionSecurityMiddleware,
  csrfProtection(),
  revokeSession
);

router.delete(
  '/sessions',
  authenticate({ requireSession: true }),
  sessionSecurityMiddleware,
  csrfProtection(),
  revokeAllOtherSessions
);

router.put(
  '/session/extend',
  authenticate({ requireSession: true }),
  sessionSecurityMiddleware,
  csrfProtection(),
  extendSession
);

export default router;
