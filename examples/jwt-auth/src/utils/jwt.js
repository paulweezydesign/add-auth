import jwt from 'jsonwebtoken';

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId, email) =>
  jwt.sign(
    {
      userId,
      email,
      type: 'access',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' }
  );

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId, email) =>
  jwt.sign(
    {
      userId,
      email,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' }
  );

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET
  );
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
};
