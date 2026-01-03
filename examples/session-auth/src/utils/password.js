const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  return bcrypt.hash(password, rounds);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) errors.push('Password must be at least 8 characters long');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character');

  return { isValid: errors.length === 0, errors };
}

module.exports = { hashPassword, comparePassword, validatePassword };

