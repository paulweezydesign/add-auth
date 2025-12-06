# Role-Based Access Control (RBAC) Example

A comprehensive implementation of role-based and permission-based access control for multi-tenant applications.

## Overview

This example demonstrates:
- Role management (create, update, delete roles)
- Permission-based authorization
- User role assignment
- Resource ownership validation
- Admin panel for role management
- Hierarchical permissions
- Dynamic permission checking

## Features

- ✅ Role Management (CRUD)
- ✅ Permission System
- ✅ User Role Assignment
- ✅ Resource-Based Authorization
- ✅ Permission Inheritance
- ✅ Admin Dashboard
- ✅ Audit Logging
- ✅ Dynamic Access Control

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Run database migrations:**
   ```bash
   # From the main project directory
   npm run migrate
   ```

4. **Seed default roles:**
   ```bash
   npm run seed
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3003`

## Default Roles

### Admin
- Full system access
- Can manage roles and permissions
- Can assign roles to users
- Can access all resources

**Permissions:**
- `*:*` (all permissions)

### Manager
- Can manage team members
- Can view reports
- Can approve requests

**Permissions:**
- `users:read`
- `users:update`
- `reports:read`
- `requests:approve`

### User
- Basic user access
- Can view own profile
- Can update own data

**Permissions:**
- `profile:read`
- `profile:update`
- `content:read`

### Guest
- Read-only access
- Public content only

**Permissions:**
- `content:read`

## API Endpoints

### Role Management

#### Create Role (Admin only)

```bash
curl -X POST http://localhost:3003/api/roles \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moderator",
    "description": "Content moderator role",
    "permissions": ["content:read", "content:update", "users:read"]
  }'
```

#### Get All Roles

```bash
curl -X GET http://localhost:3003/api/roles \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "admin",
        "description": "Administrator role",
        "permissions": ["*:*"],
        "userCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Update Role (Admin only)

```bash
curl -X PUT http://localhost:3003/api/roles/{roleId} \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "permissions": ["content:read", "content:update", "content:delete"]
  }'
```

#### Delete Role (Admin only)

```bash
curl -X DELETE http://localhost:3003/api/roles/{roleId} \
  -H "Authorization: Bearer {admin-token}"
```

### User Role Assignment

#### Assign Role to User (Admin only)

```bash
curl -X POST http://localhost:3003/api/roles/assign \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "roleId": "role-uuid"
  }'
```

#### Remove Role from User (Admin only)

```bash
curl -X DELETE http://localhost:3003/api/roles/assign/{userId}/{roleId} \
  -H "Authorization: Bearer {admin-token}"
```

#### Get User Roles

```bash
curl -X GET http://localhost:3003/api/users/{userId}/roles \
  -H "Authorization: Bearer {token}"
```

### Protected Routes

#### Access with Permission Check

```bash
# Requires 'content:update' permission
curl -X PUT http://localhost:3003/api/content/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated content"
  }'
```

## Permission System

### Permission Format

Permissions follow the format: `resource:action`

**Examples:**
- `users:read` - Read user data
- `users:create` - Create users
- `users:update` - Update users
- `users:delete` - Delete users
- `content:*` - All content permissions
- `*:*` - All permissions (admin)

### Permission Checking

```javascript
// Check single permission
if (hasPermission(user, 'users:read')) {
  // Allow access
}

// Check multiple permissions (AND)
if (hasAllPermissions(user, ['users:read', 'users:update'])) {
  // Allow access
}

// Check multiple permissions (OR)
if (hasAnyPermission(user, ['users:read', 'content:read'])) {
  // Allow access
}
```

### Resource Ownership

```javascript
// Check if user owns resource
if (isResourceOwner(user.id, resource.ownerId) || hasPermission(user, 'admin:*')) {
  // Allow access
}
```

## Middleware Usage

### Require Permission

```javascript
const { requirePermission } = require('./middleware/rbac');

// Single permission
router.put('/content/:id', 
  requirePermission('content:update'),
  updateContent
);

// Multiple permissions (AND)
router.delete('/users/:id',
  requirePermission(['users:delete', 'admin:access']),
  deleteUser
);
```

### Require Role

```javascript
const { requireRole } = require('./middleware/rbac');

// Single role
router.get('/admin/dashboard',
  requireRole('admin'),
  getDashboard
);

// Multiple roles (OR)
router.get('/reports',
  requireRole(['admin', 'manager']),
  getReports
);
```

### Require Resource Ownership

```javascript
const { requireOwnership } = require('./middleware/rbac');

router.put('/posts/:id',
  requireOwnership('posts'),
  updatePost
);
```

## How It Works

### 1. Role Assignment

1. Admin creates role with permissions
2. Admin assigns role to user
3. User inherits all role permissions
4. Multiple roles can be assigned (permissions combine)

### 2. Permission Check

1. Request includes user token
2. Middleware extracts user from token
3. User roles are fetched from database
4. Permissions are aggregated from all roles
5. Required permission is checked
6. Access granted or denied

### 3. Resource Ownership

1. Resource ownership is determined
2. User ID is compared with resource owner
3. Access granted if owner OR has override permission

## Database Schema

### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Roles Table

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

## Security Considerations

### Best Practices

1. **Principle of Least Privilege:**
   - Grant minimum permissions needed
   - Regular permission audits
   - Remove unused permissions

2. **Separation of Concerns:**
   - Separate admin and user permissions
   - Different roles for different functions
   - No overlap where not needed

3. **Audit Logging:**
   - Log all permission changes
   - Log role assignments
   - Monitor suspicious access patterns

4. **Permission Validation:**
   - Validate on every request
   - Don't cache permissions too long
   - Re-validate after role changes

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://localhost:5432/add_auth_examples
DB_HOST=localhost
DB_PORT=5432
DB_NAME=add_auth_examples
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3003
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# Default Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecureAdminPassword123!
```

## Testing

### Test Permission Checks

```bash
# Login as admin
ADMIN_TOKEN=$(curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecureAdminPassword123!"}' \
  | jq -r '.data.accessToken')

# Create a role
curl -X POST http://localhost:3003/api/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "editor",
    "permissions": ["content:read", "content:update"]
  }'

# Assign role to user
curl -X POST http://localhost:3003/api/roles/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId":"user-id","roleId":"role-id"}'
```

## Common Patterns

### Multi-Tenancy

```javascript
// Check tenant access
function requireTenant(req, res, next) {
  const tenantId = req.params.tenantId;
  const userTenants = req.user.tenants;
  
  if (!userTenants.includes(tenantId)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}
```

### Hierarchical Roles

```javascript
// Role hierarchy
const roleHierarchy = {
  admin: ['manager', 'user', 'guest'],
  manager: ['user', 'guest'],
  user: ['guest'],
  guest: []
};

function hasRoleOrHigher(userRole, requiredRole) {
  if (userRole === requiredRole) return true;
  return roleHierarchy[userRole]?.includes(requiredRole);
}
```

### Dynamic Permissions

```javascript
// Load permissions from database
async function getUserPermissions(userId) {
  const roles = await getRolesForUser(userId);
  const permissions = new Set();
  
  for (const role of roles) {
    role.permissions.forEach(p => permissions.add(p));
  }
  
  return Array.from(permissions);
}
```

## Extending This Example

### Add Features

1. **Permission Templates:**
   - Pre-defined permission sets
   - Quick role creation

2. **Time-Based Permissions:**
   - Temporary role assignments
   - Scheduled access grants

3. **Conditional Permissions:**
   - Context-based access
   - Time-of-day restrictions

4. **Permission Requests:**
   - Users request permissions
   - Admin approval workflow

## Related Examples

- **JWT Auth:** For authentication
- **Session Auth:** For session-based access control
- **OAuth Social:** For social login with roles
- **Password Recovery:** For account management

## References

- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Casbin](https://casbin.org/) - Authorization library

## License

MIT
