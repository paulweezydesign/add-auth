# Authentication System

A comprehensive authentication system with RBAC, OAuth, sessions, and security features.

## Features
- Role-Based Access Control (RBAC)
- OAuth Integration (Google, GitHub)
- Session Management with Redis
- Password Recovery
- JWT Authentication
- Rate Limiting
- Input Validation
- Security Middleware
- Audit Logging

## 🚀 Quick Start

### Running the Main Application

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## 📚 Examples & Learning

**New to this authentication system?** Check out our comprehensive examples!

We provide **5 complete, runnable example applications** demonstrating different authentication methods:

### [View All Examples →](./examples/)

| Example | Description | Port | Complexity |
|---------|-------------|------|------------|
| [**JWT Auth**](./examples/jwt-auth/) | Token-based authentication with access/refresh tokens | 3000 | ⭐ Beginner |
| [**Session Auth**](./examples/session-auth/) | Cookie-based sessions with Redis storage | 3001 | ⭐⭐ Intermediate |
| [**OAuth Social**](./examples/oauth-social/) | Google & GitHub social login integration | 3002 | ⭐⭐ Intermediate |
| [**RBAC**](./examples/rbac/) | Role-based access control with permissions | 3003 | ⭐⭐⭐ Advanced |
| [**Password Recovery**](./examples/password-recovery/) | Forgot/reset password with email tokens | 3004 | ⭐⭐ Intermediate |

Each example includes:
- ✅ Complete, working source code
- ✅ Detailed documentation
- ✅ API endpoint examples (cURL commands)
- ✅ Environment configuration templates
- ✅ Step-by-step setup instructions

**[Quick Start Guide →](./examples/QUICKSTART.md)** | **[Browse Examples →](./examples/)**

