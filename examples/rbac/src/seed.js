require('dotenv').config();

const pool = require('./utils/db');
const { hashPassword } = require('./utils/password');

async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'SecureAdminPassword123!';
  const username = process.env.ADMIN_USERNAME || 'admin';

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  let userId;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
  } else {
    const passwordHash = await hashPassword(password);
    const created = await pool.query(
      `INSERT INTO users (email, password_hash, username, status, email_verified)
       VALUES ($1, $2, $3, 'active', TRUE)
       RETURNING id`,
      [email, passwordHash, username]
    );
    userId = created.rows[0].id;
  }

  const adminRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);
  if (adminRole.rows.length === 0) {
    throw new Error('Default roles not found. Run migrations first (npm run migrate).');
  }

  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, assigned_by)
     VALUES ($1, $2, $1)
     ON CONFLICT DO NOTHING`,
    [userId, adminRole.rows[0].id]
  );

  console.log(`✓ Admin user ensured: ${email}`);
}

async function main() {
  try {
    await pool.query('SELECT NOW()');
    await ensureAdminUser();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

