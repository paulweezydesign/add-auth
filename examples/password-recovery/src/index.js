require('dotenv').config();

const app = require('./app');
const pool = require('./utils/db');

const PORT = process.env.PORT || 3004;

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection verified');

    app.listen(PORT, () => {
      console.log(`Password Recovery server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

