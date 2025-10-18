# Add Auth UI Toolkit

A front-end companion toolkit for Add Auth that bundles a fetch-based client, React components, and vanilla JavaScript helpers. The package is prepared for npm distribution and ships with ready-to-run demos.

## Features

- Typed `AuthClient` for interacting with the Add Auth API.
- React provider, hook, and form components for rapid prototyping.
- Framework-agnostic DOM helpers that create authentication forms without a framework.
- Vite demos for both React and vanilla JavaScript.

## Installation

```bash
npm install add-auth
```

## Auth Client

```ts
import { AuthClient } from 'add-auth';

const client = new AuthClient({ baseUrl: 'http://localhost:4000' });
await client.login({ email: 'user@example.com', password: 'secret' });
const profile = await client.getProfile();
```

## React Components

```tsx
import React from 'react';
import {
  AuthProvider,
  LoginForm,
  RegisterForm,
  PasswordResetRequestForm,
  PasswordResetForm,
  LogoutButton
} from 'add-auth/react';

const App = () => (
  <AuthProvider baseUrl="http://localhost:4000" autoFetchProfile>
    <LoginForm />
    <RegisterForm />
    <PasswordResetRequestForm />
    <PasswordResetForm />
    <LogoutButton />
  </AuthProvider>
);
```

## Vanilla JavaScript Helpers

```ts
import {
  AuthClient,
  createLoginForm,
  createRegistrationForm,
  createPasswordResetRequestForm,
  createPasswordResetForm,
  createLogoutButton
} from 'add-auth/vanilla';

const client = new AuthClient({ baseUrl: 'http://localhost:4000' });
const login = createLoginForm({ client });
document.querySelector('#login')?.appendChild(login.element);
```

Each helper returns an object with `element`, `reset()`, and `destroy()` (for forms) so you can manage lifecycle inside any UI stack.

## Running the Demos

Two Vite-powered demos live in `examples/`:

```bash
# build the library first
npm run build

# React demo
npm install --prefix examples/react-demo
npm run build --prefix examples/react-demo

# Vanilla demo
npm install --prefix examples/vanilla-demo
npm run build --prefix examples/vanilla-demo
```

Each demo declares `add-auth` as a file dependency, so they always consume the local build output in `dist/`.

## Publish Checklist

1. Run `npm run build` to compile TypeScript and generate declaration files.
2. Verify the React and vanilla demos build successfully (see commands above).
3. Update the version in `package.json`.
4. Publish with `npm publish` when ready.

The published package exposes the following entry points via the exports map:

- `add-auth` – aggregate exports (`AuthClient`, React bindings, and DOM helpers).
- `add-auth/react` – React context, hooks, and UI components.
- `add-auth/vanilla` – DOM helpers for non-framework projects.
- `add-auth/shared` – shared types and the `AuthClient` class.
