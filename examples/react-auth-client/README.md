# React Auth Client Example

This is a modern React 19+ application demonstrating how to consume the JWT Authentication backend.

## Features

*   **React 19+ (RC)**: Utilizes the latest React patterns including Hooks and `useTransition`.
*   **Vite**: Fast build tool and dev server.
*   **Context API**: Global state management for authentication.
*   **JWT Handling**: Implements access token storage and automatic refresh token rotation logic.
*   **Protected Routes**: Secure navigation guards.

## Prerequisites

*   Node.js 18+
*   The `jwt-auth` backend must be running on port 3000.

## Quick Start

1.  **Start the Backend**:
    Open a terminal and navigate to the `jwt-auth` example:
    ```bash
    cd ../jwt-auth
    npm install
    # Set up .env if you haven't (cp .env.example .env)
    npm start
    ```

2.  **Start the React App**:
    Open a new terminal:
    ```bash
    cd examples/react-auth-client
    npm install
    npm run dev
    ```

3.  Open http://localhost:5173 in your browser.

## Project Structure

*   `src/context/AuthContext.jsx`: Handles global auth state, login/register/logout logic, and token persistence.
*   `src/services/api.js`: Wrapper around `fetch` to handle headers and errors.
*   `src/services/authService.js`: Specific auth API calls.
*   `src/components/ProtectedRoute.jsx`: HOC to protect routes from unauthenticated access.
*   `src/pages/`: UI pages (Login, Register, Dashboard, Home).

## Key Implementation Details

*   **Token Storage**: Access tokens are stored in `localStorage` (for simplicity in this demo) and React state. In a production app, you might consider `httpOnly` cookies or memory-only storage for access tokens to mitigate XSS.
*   **Refresh Logic**: The `AuthContext` includes an interceptor-like pattern in `initAuth` to try refreshing the token if the initial profile fetch fails with 401.
