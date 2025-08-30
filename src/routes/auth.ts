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
  authenticateToken
} from '../middleware';
import {
  register,
  login,
  logout,
  refresh,
  getUserInfo,
  updateProfile
} from '../controllers/auth';

const router = Router();

// Apply base security middleware to all auth routes
router.use(securityMiddleware.auth);

/**
 * POST /api/auth/register
 * User registration with comprehensive security
 */
router.post(
  '/register',
  // Apply registration-specific rate limiting
  rateLimiters.registration,
  // Validate request body
  validateBody(validationSchemas.userRegistration),
  // Controller implementation
  register
);

/**
 * POST /api/auth/login
 * User login with security protection
 */
router.post(
  '/login',
  // Apply login-specific rate limiting
  rateLimiters.login,
  // Validate login credentials
  validateBody(validationSchemas.userLogin),
  // Controller implementation
  login
);

/**
 * POST /api/auth/logout
 * User logout with token blacklisting
 */
router.post(
  '/logout',
  // Authenticate user first
  authenticateToken,
  // CSRF protection for state-changing operations
  csrfProtection(),
  // Controller implementation
  logout
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  // Apply refresh-specific rate limiting
  rateLimiters.refresh,
  // Validate refresh token
  validateBody(validationSchemas.refreshToken),
  // Controller implementation
  refresh
);

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get(
  '/me',
  // Authenticate user first
  authenticateToken,
  // Basic security for read operations
  securityMiddleware.basic,
  // Controller implementation
  getUserInfo
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  // Authenticate user first
  authenticateToken,
  // Validate profile update data
  validateBody(validationSchemas.userProfileUpdate),
  // CSRF protection for state-changing operations
  csrfProtection(),
  // Controller implementation
  updateProfile
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  // Authenticate user first
  authenticateToken,
  // Validate password change request
  validateBody(validationSchemas.passwordChange),
  // CSRF protection for state-changing operations
  csrfProtection(),
  // Controller would go here - TODO: implement password change
  async (req, res) => {
    res.json({ 
      success: true, 
      message: 'Password change endpoint - implementation pending' 
    });
  }
);

/**
 * GET /api/auth/csrf-token
 * Get CSRF token for client-side use
 */
router.get(
  '/csrf-token',
  // Generate CSRF token
  csrfProtection(),
  (req, res) => {
    res.json({
      success: true,
      csrfToken: res.locals.csrfToken
    });
  }
);

export default router;