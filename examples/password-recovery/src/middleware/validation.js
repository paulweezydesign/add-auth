function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEmailOnly(req, res, next) {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Validation failed', message: 'Valid email is required' });
  }
  next();
}

function validateTokenOnly(req, res, next) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Validation failed', message: 'Token is required' });
  }
  next();
}

function validateResetPassword(req, res, next) {
  const { token, newPassword } = req.body;
  const errors = [];
  if (!token) errors.push('Token is required');
  if (!newPassword) errors.push('New password is required');
  if (errors.length) return res.status(400).json({ success: false, error: 'Validation failed', errors });
  next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = [];
  if (!currentPassword) errors.push('Current password is required');
  if (!newPassword) errors.push('New password is required');
  if (errors.length) return res.status(400).json({ success: false, error: 'Validation failed', errors });
  next();
}

// Optional helpers to make the example self-contained (auth for testing)
function validateRegister(req, res, next) {
  const { email, password, username } = req.body;
  const errors = [];
  if (!email || !isValidEmail(email)) errors.push('Valid email is required');
  if (!password) errors.push('Password is required');
  if (!username) errors.push('Username is required');
  if (errors.length) return res.status(400).json({ success: false, error: 'Validation failed', errors });
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];
  if (!email || !isValidEmail(email)) errors.push('Valid email is required');
  if (!password) errors.push('Password is required');
  if (errors.length) return res.status(400).json({ success: false, error: 'Validation failed', errors });
  next();
}

module.exports = {
  validateEmailOnly,
  validateTokenOnly,
  validateResetPassword,
  validateChangePassword,
  validateRegister,
  validateLogin
};

