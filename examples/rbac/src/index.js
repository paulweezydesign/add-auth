import 'dotenv/config';
import app from './app.js';
import pool from './utils/db.js';

const PORT = process.env.PORT ?? 3003;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection verified');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   RBAC (Role-Based Access Control) Example     ║
║                                                ║
║   Server running on: http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV ?? 'development'}                   ║
║                                                ║
║   Auth Endpoints:                              ║
║   POST /api/auth/register                      ║
║   POST /api/auth/login                         ║
║   GET  /api/auth/me                            ║
║                                                ║
║   Role Endpoints:                              ║
║   GET    /api/roles                            ║
║   POST   /api/roles                            ║
║   PUT    /api/roles/:id                        ║
║   DELETE /api/roles/:id                        ║
║   POST   /api/roles/assign                     ║
║   DELETE /api/roles/assign/:userId/:roleId     ║
║                                                ║
║   User Endpoints:                              ║
║   GET    /api/users/:id/roles                  ║
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
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
