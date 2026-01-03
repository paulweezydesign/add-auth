# Vanilla JavaScript Frontend Example

A modern vanilla JavaScript frontend application demonstrating authentication using ES6+ modules, functional programming patterns, and best practices.

## Features

- ✅ Modern ES6+ JavaScript with modules
- ✅ Functional programming patterns
- ✅ Client-side routing
- ✅ Token-based authentication
- ✅ Automatic token refresh
- ✅ Responsive design
- ✅ Error handling
- ✅ Form validation

## Technology Stack

- **Vanilla JavaScript** (ES6+ modules)
- **Vite** (build tool and dev server)
- **Modern CSS** (CSS variables, flexbox)

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see `examples/jwt-auth/`)

### Installation

```bash
cd examples/vanilla-js-frontend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
vanilla-js-frontend/
├── src/
│   ├── main.js              # Application entry point
│   ├── router.js            # Client-side router
│   ├── services/
│   │   └── auth.js          # Authentication service
│   ├── pages/
│   │   ├── login.js         # Login page component
│   │   ├── register.js      # Register page component
│   │   └── dashboard.js     # Dashboard page component
│   ├── utils/
│   │   └── notifications.js # Notification utility
│   └── styles.css           # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Code Patterns

### ES6 Modules

```javascript
import { AuthService } from './services/auth.js';
```

### Functional Programming

```javascript
// Pure functions
const showNotification = (message, type = 'info') => {
  // ...
};

// Higher-order functions
navLinks.forEach(link => {
  link.addEventListener('click', handleClick);
});
```

### Async/Await

```javascript
const result = await this.authService.login({ email, password });
```

### Arrow Functions

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  // ...
};
```

### Destructuring

```javascript
const { email, password } = formData;
```

### Template Literals

```javascript
const html = `<div>Hello ${username}</div>`;
```

## API Integration

The frontend communicates with the backend API at `/api/auth`:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

## Authentication Flow

1. User registers/logs in
2. Tokens stored in localStorage
3. Tokens included in Authorization header
4. Automatic token refresh on 401
5. Redirect to login on authentication failure

## Best Practices

- ✅ ES6+ modules for code organization
- ✅ Functional programming patterns
- ✅ Separation of concerns (services, pages, utils)
- ✅ Error handling
- ✅ Form validation
- ✅ Accessibility (autocomplete, labels)
- ✅ Responsive design
- ✅ No global variables
- ✅ Immutable data patterns where possible

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
