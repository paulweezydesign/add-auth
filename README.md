# Authentication System

A comprehensive authentication system with RBAC, OAuth, sessions, security features, and ready-to-use frontend widgets.

## Features
- Role-Based Access Control (RBAC)
- OAuth Integration
- Session Management
- Password Recovery
- Rate Limiting
- Input Validation
- Security Middleware
- React and Vanilla JS authentication widgets

## Getting Started
```bash
npm install
npm run build
```

### Running the API Locally
```bash
npm run dev
```

### Starting the compiled server
```bash
npm start
```

## Frontend Components

### React
```tsx
import React from 'react';
import { AuthForm } from 'add-auth/react';

export function SignIn() {
  return (
    <AuthForm
      onSubmit={async (values) => {
        // call your API or leverage the default behaviour
        console.log(values);
        return { ok: true, message: 'Signed in!' };
      }}
    />
  );
}
```

### Vanilla JavaScript
```js
import { createAuthWidget } from 'add-auth/vanilla';

document.addEventListener('DOMContentLoaded', () => {
  createAuthWidget('#auth-root', {
    onSubmit: async (values) => {
      console.log(values);
      return { ok: true, message: 'Signed in!' };
    },
  });
});
```

## Demos

Run the automated demos to verify both widget integrations:

```bash
npm run demo:react
npm run demo:vanilla
```

Each script renders the component in a headless DOM environment and prints the submitted values and status message.

## Publishing Checklist
- `npm run build`
- Ensure `dist/` output is up to date
- Verify `npm run demo:react` and `npm run demo:vanilla`
- Update the version number in `package.json`
- Publish with `npm publish`
