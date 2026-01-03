import crypto from 'crypto';

/**
 * Generate a secure random token
 */
export const generateResetToken = (length = 32) =>
  crypto.randomBytes(length).toString('hex');

/**
 * Hash a token for secure storage
 */
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Get token expiration time
 */
export const getTokenExpiry = () => {
  const expiryMs = parseInt(process.env.RESET_TOKEN_EXPIRY ?? '3600000', 10); // 1 hour default
  return new Date(Date.now() + expiryMs);
};
