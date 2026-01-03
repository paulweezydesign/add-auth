const jwt = require('jsonwebtoken');

function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function verifyAccessToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

module.exports = { generateAccessToken, verifyAccessToken };

