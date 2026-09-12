# Add-Auth React + Vite Demo

A React + TypeScript + Vite example showing how to integrate with the `@paulweezydesign/add-auth` authentication API.

## Features

- User registration with validation
- Login with JWT tokens
- Dashboard showing user info
- CSRF token handling
- Session cookie management
- Logout with token cleanup

## Quick Start

```bash
# 1. Make sure the auth API is running on port 3000
cd ../.. && npm run dev

# 2. Install dependencies and start the React app
cd examples/react-auth-demo
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## How It Works

1. **CSRF Token**: Before any POST request, the app fetches a CSRF token from `GET /api/auth/csrf-token`
2. **Registration**: POST to `/api/auth/register` with username, email, password
3. **Login**: POST to `/api/auth/login` with email and password
4. **Auth Header**: After login, the JWT access token is sent via `Authorization: Bearer <token>`
5. **Cookies**: Session cookies are automatically managed via `credentials: 'include'`
