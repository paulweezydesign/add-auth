const { verifyAccessToken } = require('../utils/jwt');

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided', message: 'Authentication required' });
    }

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token', message: 'Authentication token is invalid' });
  }
}

module.exports = { authenticateToken };

