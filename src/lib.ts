/**
 * Add-Auth Library
 * Main entry point for the authentication library
 * Exports all reusable components for consumption in other applications
 */

// Middleware exports - Import specific middleware to avoid loading issues
export { 
  rateLimiters,
  createCustomRateLimiter,
  createUserRateLimiter,
  rateLimiterHealthCheck,
  closeRedisConnection,
  redisClient
} from './middleware/rateLimiter';
export {
  generateCSRFToken,
  validateCSRFToken,
  generateCSRFMiddleware,
  validateCSRFMiddleware,
  getCSRFTokenEndpoint,
  cleanupExpiredCSRFTokens,
  csrfProtection
} from './middleware/csrfProtection';
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  sanitizeInput,
  validateAndSanitize,
  validationSchemas,
  isValidEmail,
  isStrongPassword
} from './middleware/validation';
export {
  sanitizeString,
  sanitizeObject,
  xssProtection,
  strictXSSProtection,
  xssProtectFields,
  contentSecurityPolicy,
  escapeHtml,
  sanitizeUrl,
  safeJsonParse,
  detectXSS,
  xssDetection
} from './middleware/xssProtection';
export {
  sqlInjectionPrevention,
  sqlInjectionSanitization,
  sqlInjectionDetectionFields,
  detectSQLInjection,
  sanitizeSQLInput,
  sanitizeObjectSQL,
  createParameterizedQuery,
  buildSafeQuery,
  validateIdentifier,
  escapeIdentifier
} from './middleware/sqlInjectionPrevention';

export { authenticateToken, optionalAuth } from './middleware/auth';
export { 
  requireAuth,
  requireRole, 
  requirePermission, 
  requireRoleOrPermission,
  requireOwnership,
  requireAdmin,
  requireModerator,
  requireTrustScore,
  hasPermission,
  getUserRoles,
  getUserPermissions
} from './middleware/rbac';
// Note: sessionMiddleware requires Redis initialization before import
// Users should import directly: import { sessionMiddleware } from '@paulweezydesign/add-auth/dist/middleware/session';
// export { sessionMiddleware } from './middleware/session';
export { 
  globalErrorHandler, 
  notFoundHandler, 
  asyncHandler, 
  rateLimitHandler,
  formatValidationError 
} from './middleware/errorHandler';
export { localizationMiddleware } from './middleware/localization';

// Models exports
export { UserModel } from './models/User';
export { RoleModel } from './models/Role';
export { SessionModel } from './models/Session';
export { AuditLogModel } from './models/AuditLog';

// Types exports
export type { User, CreateUserInput, UpdateUserInput } from './types/user';
export type { Role, CreateRoleInput, UpdateRoleInput, UserRole, AssignRoleInput } from './types/role';
export type { JWTPayload, RefreshTokenData, TokenPair, BlacklistedToken, TokenValidationResult } from './types/jwt';
export type { AuditLog, CreateAuditLogInput } from './types/audit';

// Utilities exports
export { AuthUtils } from './utils/auth';
export { 
  generateAccessToken,
  generateRefreshToken as generateRefreshJWT,
  validateAccessToken,
  validateRefreshToken as validateRefreshJWT,
  getTokenId,
  getUserIdFromToken,
  getTokenMetadata,
  isTokenExpired,
  verifyToken,
  extractTokenFromHeader
} from './utils/jwt';
export { logger } from './utils/logger';
export { PERMISSIONS, PERMISSION_GROUPS, PermissionService } from './utils/permissions';
export { 
  createRefreshToken,
  validateRefreshToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  getRefreshTokenMetadata,
  cleanupExpiredRefreshTokens,
  getUserRefreshTokens,
  shouldRotateRefreshToken,
  createAuthenticationTokens,
  startRefreshTokenCleanup
} from './utils/refreshToken';
export { 
  addToBlacklist,
  isTokenBlacklisted,
  validateTokenNotBlacklisted,
  removeFromBlacklist,
  getBlacklistInfo,
  blacklistAllUserTokens,
  cleanupExpiredBlacklistedTokens,
  getUserBlacklistedTokens,
  getBlacklistStats,
  performLogout,
  performSecurityRevocation,
  enforceTokenBlacklist,
  startBlacklistCleanup,
  initializeBlacklistSystem
} from './utils/tokenBlacklist';
export { FingerprintService } from './utils/fingerprint';
export type { DeviceFingerprint, FingerprintValidationResult } from './utils/fingerprint';
export { EmailService, emailService } from './utils/emailService';
export type { EmailConfig, EmailTemplate, EmailOptions } from './utils/emailService';
export { createRedisClient } from './utils/redis';

// Security exports
export { PasswordResetManager, passwordResetManager } from './security/passwordReset';
export type { PasswordResetToken, PasswordResetRequest, PasswordResetConfig } from './security/passwordReset';

// Config exports (for configuration helpers)
export { appConfig } from './config';

// Database exports
export { db } from './database/connection';

// Service exports
export { SessionService } from './services/sessionService';

/**
 * Re-export security configuration helpers
 */
export { securityConfigs } from './middleware/index';
