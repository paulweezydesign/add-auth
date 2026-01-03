# React 19+ Frontend Example

A modern React 19+ frontend application demonstrating authentication using hooks, context API, and functional components with best practices.

## Features

- ✅ React 19+ with latest features
- ✅ Functional components with hooks
- ✅ Context API for state management
- ✅ React Router for navigation
- ✅ Custom hooks (useAuth, useNotification)
- ✅ Protected routes
- ✅ Token-based authentication
- ✅ Automatic token refresh
- ✅ Responsive design
- ✅ Error handling
- ✅ Form validation

## Technology Stack

- **React 19+** (latest version)
- **React Router DOM** (v6)
- **Vite** (build tool and dev server)
- **Modern CSS** (CSS variables, flexbox)

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (see `examples/jwt-auth/`)

### Installation

```bash
cd examples/react-frontend
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

The app will be available at `http://localhost:5174`

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
react-frontend/
├── src/
│   ├── main.jsx              # Application entry point
│   ├── App.jsx               # Main app component
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Authentication context
│   │   └── NotificationContext.jsx  # Notification context
│   ├── components/
│   │   ├── ProtectedRoute.jsx # Protected route wrapper
│   │   └── Notification.jsx   # Notification component
│   ├── pages/
│   │   ├── LoginPage.jsx      # Login page
│   │   ├── RegisterPage.jsx   # Register page
│   │   └── DashboardPage.jsx # Dashboard page
│   ├── services/
│   │   └── auth.js            # Authentication service
│   ├── App.css                # App styles
│   └── index.css              # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## React Patterns

### Functional Components

```jsx
const LoginPage = () => {
  // Component logic
  return <div>...</div>;
};
```

### Hooks

```jsx
const { user, login, logout } = useAuth();
const [formData, setFormData] = useState({ email: '', password: '' });
```

### Context API

```jsx
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ...
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Custom Hooks

```jsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### useEffect Hook

```jsx
useEffect(() => {
  const checkAuth = async () => {
    // Check authentication
  };
  checkAuth();
}, []);
```

### useCallback Hook

```jsx
const login = useCallback(async ({ email, password }) => {
  // Login logic
}, []);
```

### useNavigate Hook

```jsx
const navigate = useNavigate();
navigate('/dashboard');
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
5. Protected routes redirect to login on failure

## Best Practices

- ✅ Functional components only
- ✅ Hooks for state management
- ✅ Context API for global state
- ✅ Custom hooks for reusable logic
- ✅ Separation of concerns (components, contexts, services)
- ✅ Error handling
- ✅ Form validation
- ✅ Accessibility (autocomplete, labels)
- ✅ Responsive design
- ✅ TypeScript-ready structure

## React 19 Features Used

- Latest React APIs
- Improved hooks performance
- Better error boundaries support
- Enhanced concurrent features

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
