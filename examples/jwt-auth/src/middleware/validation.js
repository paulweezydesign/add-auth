/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate registration input
 */
function validateRegistration(req, res, next) {
  const { email, password, username } = req.body;
  const errors = [];

  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Validate username
  if (!username) {
    errors.push('Username is required');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 30) {
    errors.push('Username must not exceed 30 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Validate login input
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Validate refresh token request
 */
function validateRefreshToken(req, res, next) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Refresh token is required'
    });
  }

  next();
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateRefreshToken
};
