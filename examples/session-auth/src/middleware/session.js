import { validateFingerprint } from '../utils/fingerprint.js';

/**
 * Middleware to validate session
 */
export const requireSession = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'Please login to access this resource',
    });
  }

  // Validate fingerprint if stored
  if (req.session.fingerprint) {
    const isValidFingerprint = validateFingerprint(req, req.session.fingerprint);
    if (!isValidFingerprint) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });

      return res.status(401).json({
        success: false,
        error: 'Session invalid',
        message: 'Your session has been invalidated for security reasons. Please login again.',
      });
    }
  }

  // Update last activity
  req.session.lastActivity = Date.now();

  next();
};

/**
 * Optional session middleware - attaches user if logged in, but doesn't require it
 */
export const optionalSession = (req, _res, next) => {
  if (req.session?.userId && req.session.fingerprint) {
    const isValidFingerprint = validateFingerprint(req, req.session.fingerprint);
    if (!isValidFingerprint) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
    }
  }
  next();
};
