require('dotenv').config();

const express = require('express');
const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const usersRoutes = require('./routes/users');
const contentRoutes = require('./routes/content');
const { authenticateToken } = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', authenticateToken, rolesRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/content', authenticateToken, contentRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'RBAC Example API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found', message: 'The requested endpoint does not exist' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

module.exports = app;

