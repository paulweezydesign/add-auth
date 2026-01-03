import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import pool from './utils/db.js';
import { hashPassword } from './utils/password.js';

const defaultRoles = [
  {
    name: 'admin',
    description: 'Administrator with full system access',
    permissions: ['*:*'],
  },
  {
    name: 'manager',
    description: 'Manager with team and report access',
    permissions: ['users:read', 'users:update', 'reports:read', 'requests:approve', 'roles:read'],
  },
  {
    name: 'user',
    description: 'Standard user with basic access',
    permissions: ['profile:read', 'profile:update', 'content:read'],
  },
  {
    name: 'guest',
    description: 'Guest with read-only access',
    permissions: ['content:read'],
  },
];

const seed = async () => {
  try {
    console.log('Starting database seed...');

    // Create roles
    for (const role of defaultRoles) {
      const existingRole = await pool.query(
        'SELECT id FROM roles WHERE name = $1',
        [role.name]
      );

      if (existingRole.rows.length === 0) {
        const id = uuidv4();
        await pool.query(
          `INSERT INTO roles (id, name, description, permissions)
           VALUES ($1, $2, $3, $4)`,
          [id, role.name, role.description, JSON.stringify(role.permissions)]
        );
        console.log(`✓ Created role: ${role.name}`);
      } else {
        console.log(`- Role already exists: ${role.name}`);
      }
    }

    // Create default admin user
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'SecureAdminPassword123!';

    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail.toLowerCase()]
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await hashPassword(adminPassword);
      const userId = uuidv4();

      await pool.query(
        `INSERT INTO users (id, email, password, username, status)
         VALUES ($1, $2, $3, 'admin', 'active')`,
        [userId, adminEmail.toLowerCase(), hashedPassword]
      );

      // Assign admin role
      const adminRole = await pool.query(
        "SELECT id FROM roles WHERE name = 'admin'"
      );

      if (adminRole.rows.length > 0) {
        await pool.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_at)
           VALUES ($1, $2, NOW())`,
          [userId, adminRole.rows[0].id]
        );
      }

      console.log(`✓ Created admin user: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
    } else {
      console.log(`- Admin user already exists: ${adminEmail}`);
    }

    console.log('\n✓ Seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seed();
