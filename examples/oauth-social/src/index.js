import 'dotenv/config';
import app from './app.js';
import pool from './utils/db.js';
import redis from './utils/redis.js';

const PORT = process.env.PORT ?? 3002;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection verified');

    // Test Redis connection
    await redis.ping();
    console.log('✓ Redis connection verified');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   OAuth Social Login Example Server            ║
║                                                ║
║   Server running on: http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV ?? 'development'}                   ║
║                                                ║
║   OAuth Endpoints:                             ║
║   GET  /auth/google                            ║
║   GET  /auth/google/callback                   ║
║   GET  /auth/github                            ║
║   GET  /auth/github/callback                   ║
║   GET  /auth/link/google                       ║
║   GET  /auth/link/github                       ║
║   POST /auth/logout                            ║
║                                                ║
║   API Endpoints:                               ║
║   GET    /api/oauth/accounts                   ║
║   DELETE /api/oauth/unlink/:provider           ║
║                                                ║
║   Health check: http://localhost:${PORT}/health  ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  await pool.end();
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
