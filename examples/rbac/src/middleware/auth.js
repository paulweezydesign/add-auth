import { verifyAccessToken } from '../utils/jwt.js';
import { getUserPermissions, getUserRoles } from '../utils/permissions.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication required',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch fresh permissions from database
    const [permissions, roles] = await Promise.all([
      getUserPermissions(decoded.userId),
      getUserRoles(decoded.userId),
    ]);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      permissions,
      roles,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};
