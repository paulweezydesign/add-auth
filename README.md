# Add-Auth

A secure authentication system built with Node.js, TypeScript, and PostgreSQL.

## Features

- User registration and authentication
- JWT-based session management
- Role-based access control (RBAC)
- Comprehensive audit logging
- Password hashing with bcrypt
- Account lockout protection
- Database migrations
- TypeScript for type safety
- Comprehensive logging with Winston

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd add-auth
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and security keys.

4. Set up PostgreSQL database:
   ```bash
   createdb add_auth
   ```

5. Run database migrations:
   ```bash
   npm run migrate
   ```

## Usage

### Development

Start the development server:
```bash
npm run dev
```

### Production

Build and start the production server:
```bash
npm run build
npm start
```

### Database Migrations

Run pending migrations:
```bash
npm run migrate
```

Check migration status:
```bash
ts-node src/database/migrate.ts status
```

Rollback migrations:
```bash
npm run migrate:rollback
```

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `password_hash` (VARCHAR) - Bcrypt hash of password
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time
- `status` (ENUM) - Account status (active, inactive, suspended, deleted)
- `email_verified` (BOOLEAN) - Email verification status
- `last_login` (TIMESTAMP) - Last successful login
- `failed_login_attempts` (INTEGER) - Failed login counter
- `locked_until` (TIMESTAMP) - Account lock expiration

### Sessions Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `token` (VARCHAR) - Session token
- `expires_at` (TIMESTAMP) - Session expiration
- `created_at` (TIMESTAMP) - Session creation time
- `ip_address` (INET) - Client IP address
- `user_agent` (TEXT) - Client user agent
- `is_active` (BOOLEAN) - Session active status
- `last_accessed` (TIMESTAMP) - Last access time

### Roles Table
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Role name
- `description` (TEXT) - Role description
- `permissions` (JSONB) - Array of permissions
- `created_at` (TIMESTAMP) - Role creation time
- `updated_at` (TIMESTAMP) - Last update time

### User Roles Table
- `user_id` (UUID) - Foreign key to users
- `role_id` (UUID) - Foreign key to roles
- `assigned_at` (TIMESTAMP) - Assignment time
- `assigned_by` (UUID) - Who assigned the role

### Audit Logs Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `action` (VARCHAR) - Action performed
- `resource_type` (VARCHAR) - Type of resource
- `resource_id` (UUID) - ID of affected resource
- `timestamp` (TIMESTAMP) - Action timestamp
- `ip_address` (INET) - Client IP address
- `user_agent` (TEXT) - Client user agent
- `details` (JSONB) - Additional details
- `success` (BOOLEAN) - Success status
- `error_message` (TEXT) - Error message if failed

## Security Features

### Password Security
- Bcrypt hashing with configurable rounds
- Password complexity requirements
- Account lockout after failed attempts

### Session Security
- JWT tokens with expiration
- Session invalidation
- IP address and user agent tracking

### Audit Trail
- Comprehensive logging of all actions
- Failed login attempt tracking
- IP address monitoring

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | add_auth |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `BCRYPT_ROUNDS` | Bcrypt hash rounds | 12 |
| `SESSION_TIMEOUT` | Session timeout (ms) | 86400000 |
| `LOG_LEVEL` | Log level | info |

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Authentication (Coming Soon)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Users (Coming Soon)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Roles (Coming Soon)
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

## License

MIT