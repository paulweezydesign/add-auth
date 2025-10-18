# Authentication System

A comprehensive authentication system with RBAC, OAuth, sessions, and security features.

## Features
- Role-Based Access Control (RBAC)
- OAuth Integration
- Session Management
- Password Recovery
- Rate Limiting
- Input Validation
- Security Middleware

## Getting Started
```bash
npm install
npm run dev
```

## Package Usage

The project now ships both the backend server utilities and front-end helpers that can be published to npm.

### Build for npm

```bash
npm run build
```

The compiled artifacts are emitted to `dist/` and include type declarations for Node, React, and vanilla JavaScript consumers.

### React components

```tsx
import { AuthProvider, LoginForm, RegisterForm, AuthStatus } from 'add-auth/react';

export function App() {
  return (
    <AuthProvider baseUrl="https://your-api.example.com/api/auth">
      <AuthStatus />
      <LoginForm />
      <RegisterForm />
    </AuthProvider>
  );
}
```

### Vanilla JavaScript helpers

```js
import { renderLoginForm, renderRegisterForm } from 'add-auth/vanilla';

const loginContainer = document.querySelector('#login');
const registerContainer = document.querySelector('#register');

renderLoginForm({ container: loginContainer, baseUrl: '/api/auth' });
renderRegisterForm({ container: registerContainer, baseUrl: '/api/auth' });
```

### Demo applications

Reference implementations for React and vanilla JavaScript live in `demos/react-demo` and `demos/vanilla-demo`. They are covered by the automated Jest test suite (`npm test`) to verify the UI helpers call the expected authentication endpoints.

