require('dotenv').config();
const app = require('./app');
const pool = require('./utils/db');

const PORT = process.env.PORT || 3000;

// Start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection verified');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   JWT Authentication Example Server            ║
║                                                ║
║   Server running on: http://localhost:${PORT}   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
║                                                ║
║   API Endpoints:                               ║
║   POST /api/auth/register                      ║
║   POST /api/auth/login                         ║
║   POST /api/auth/refresh                       ║
║   POST /api/auth/logout                        ║
║   GET  /api/auth/me                            ║
║                                                ║
║   Health check: http://localhost:${PORT}/health  ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

startServer();
