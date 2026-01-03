function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRegistration(req, res, next) {
  const { email, password, username } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  else if (!isValidEmail(email)) errors.push('Invalid email format');

  if (!password) errors.push('Password is required');

  if (!username) errors.push('Username is required');
  else if (username.length < 3) errors.push('Username must be at least 3 characters long');
  else if (username.length > 30) errors.push('Username must not exceed 30 characters');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', errors });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push('Email is required');
  else if (!isValidEmail(email)) errors.push('Invalid email format');

  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', errors });
  }

  next();
}

module.exports = { validateRegistration, validateLogin };

