# Authentication Examples

This folder contains comprehensive examples demonstrating different authentication methods supported by this authentication system. Each example is a standalone, runnable application with detailed documentation.

## Available Examples

### 1. [JWT Authentication](./jwt-auth/)
Basic authentication using JSON Web Tokens (JWT) with email and password.

**Features:**
- User registration
- User login
- Token-based authentication
- Token refresh mechanism
- Protected routes

**Best for:** REST APIs, mobile apps, SPAs

---

### 2. [Session-Based Authentication](./session-auth/)
Traditional session-based authentication using Redis for session storage.

**Features:**
- Cookie-based sessions
- Redis session store
- Session fingerprinting
- Session management (list, revoke)
- Remember me functionality

**Best for:** Server-rendered web applications, traditional web apps

---

### 3. [OAuth Social Login](./oauth-social/)
Social authentication using OAuth 2.0 providers (Google and GitHub).

**Features:**
- Google OAuth login
- GitHub OAuth login
- Account linking
- Profile synchronization
- OAuth account management

**Best for:** Consumer applications, social platforms

---

### 4. [Role-Based Access Control (RBAC)](./rbac/)
Advanced authorization with role-based and permission-based access control.

**Features:**
- Role management
- Permission-based authorization
- Resource ownership validation
- Admin panel
- User role assignment

**Best for:** Multi-tenant applications, enterprise systems

---

### 5. [Password Recovery](./password-recovery/)
Secure password reset and recovery flow.

**Features:**
- Forgot password request
- Email-based reset tokens
- Secure token validation
- Password reset
- Account recovery

**Best for:** Any application requiring password reset functionality

---

### 6. [Vanilla JavaScript Frontend](./vanilla-js-frontend/)
Modern vanilla JavaScript frontend application using ES6+ modules and functional programming patterns.

**Features:**
- ES6+ modules
- Functional programming patterns
- Client-side routing
- Token-based authentication
- Automatic token refresh
- Responsive design

**Best for:** Learning modern JavaScript, lightweight SPAs, projects without frameworks

**Technology:** Vanilla JavaScript, Vite, ES6+ modules

---

### 7. [React 19+ Frontend](./react-frontend/)
Modern React 19+ frontend application using hooks, context API, and functional components.

**Features:**
- React 19+ with latest features
- Functional components with hooks
- Context API for state management
- React Router for navigation
- Custom hooks
- Protected routes
- Token-based authentication

**Best for:** Modern React applications, component-based architectures, React ecosystem

**Technology:** React 19+, React Router, Vite, Hooks

---

## Quick Start

Each example is self-contained and can be run independently. Follow these steps:

1. **Navigate to the example directory:**
   ```bash
   cd examples/[example-name]
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the example:**
   ```bash
   npm start
   ```

5. **Test the endpoints:**
   Use the provided curl commands or import the Postman collection.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (for session-based and OAuth examples)
- OAuth credentials (for OAuth example)

## Project Structure

### Backend Examples Structure

Each backend example follows this structure:

```
example-name/
├── README.md              # Detailed example documentation
├── .env.example          # Environment variables template
├── package.json          # Dependencies (ES modules)
├── src/
│   ├── app.js           # Express application setup
│   ├── index.js         # Server entry point
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── tests/               # Example tests
└── docs/
    ├── API.md          # API endpoint documentation
    └── SETUP.md        # Setup instructions
```

### Frontend Examples Structure

Frontend examples follow modern structure:

**Vanilla JavaScript:**
```
vanilla-js-frontend/
├── src/
│   ├── main.js          # Application entry
│   ├── router.js        # Client-side router
│   ├── services/       # API services
│   ├── pages/          # Page components
│   └── utils/          # Utilities
├── index.html
└── vite.config.js
```

**React:**
```
react-frontend/
├── src/
│   ├── main.jsx        # Application entry
│   ├── App.jsx         # Main app component
│   ├── contexts/       # React contexts
│   ├── components/    # Reusable components
│   ├── pages/         # Page components
│   └── services/      # API services
├── index.html
└── vite.config.js
```

## Common Setup

All examples share these common requirements:

### Database Setup

```bash
# Create database
createdb add_auth_examples

# Run migrations (from main project)
npm run migrate
```

### Environment Variables

Common variables across all examples:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/add_auth_examples
DB_HOST=localhost
DB_PORT=5432
DB_NAME=add_auth_examples
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development

# Security
JWT_SECRET=your-jwt-secret-min-32-characters
SESSION_SECRET=your-session-secret-min-32-characters
```

See each example's `.env.example` for specific requirements.

## Testing Examples

Each example includes:
- **API documentation** with curl examples
- **Postman collection** for easy testing
- **Integration tests** demonstrating usage
- **Sample requests/responses**

## Learning Path

Recommended order for learning:

### Backend Examples
1. **Start with JWT Authentication** - Understand the basics
2. **Move to Session-Based** - Learn stateful authentication
3. **Explore OAuth Social** - Implement third-party authentication
4. **Study RBAC** - Add authorization and access control
5. **Complete with Password Recovery** - Implement account recovery

### Frontend Examples
1. **Vanilla JavaScript Frontend** - Learn modern JavaScript patterns
2. **React 19+ Frontend** - Build with React hooks and context API

### Full Stack
- Use backend examples (JWT Auth recommended) with frontend examples
- Backend runs on port 3000, frontends proxy to it automatically

## Modern JavaScript Patterns

All examples use modern JavaScript best practices:

### Backend Examples
- ✅ ES6+ modules (`import`/`export`)
- ✅ Arrow functions
- ✅ Async/await
- ✅ Destructuring
- ✅ Template literals
- ✅ Functional programming patterns
- ✅ Const/let (no var)

### Frontend Examples
- ✅ ES6+ modules
- ✅ Functional components (React)
- ✅ Hooks (React)
- ✅ Context API (React)
- ✅ Modern CSS (CSS variables, flexbox)
- ✅ Vite for fast development

## Integration

These examples are designed to work together:

### Backend + Frontend

1. **Start the backend** (e.g., JWT Auth example):
   ```bash
   cd examples/jwt-auth
   npm install
   npm start
   ```

2. **Start a frontend** (Vanilla JS or React):
   ```bash
   cd examples/vanilla-js-frontend  # or react-frontend
   npm install
   npm run dev
   ```

3. The frontend automatically proxies API requests to the backend.

### Standalone Usage

- Copy code patterns into your application
- Use as reference implementations
- Extend examples for your specific needs
- Combine multiple authentication methods

## Support

For issues or questions:
- Check the example's README.md
- Review the main project documentation
- Open an issue on GitHub

## Contributing

Contributions are welcome! To add a new example:

1. Create a new directory in `examples/`
2. Follow the project structure above
3. Include comprehensive documentation
4. Add tests
5. Update this README
6. Submit a pull request

## License

MIT License - same as the main project
