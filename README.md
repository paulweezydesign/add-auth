# add-auth

A complete authentication toolkit for modern web applications. The package bundles a fetch-based API client together with ready-to-use UI components for React and vanilla JavaScript projects.

## Key features

- TypeScript `AuthClient` for browser integrations and Node fetch environments
- React components (`AuthForm`, `AuthStatus`) with success and error handling baked in
- Framework-agnostic DOM widget via `createAuthWidget`
- Example applications for React and vanilla JavaScript
- Jest test suite covering both React and DOM usage

## Installation

```bash
npm install add-auth
```

After installing locally, build the TypeScript sources before publishing:

```bash
npm run build
```

## Usage

### Browser client utilities

Instantiate the `AuthClient` to talk to your authentication API:

```ts
import { AuthClient } from 'add-auth';

const client = new AuthClient({ baseUrl: 'http://localhost:3000' });
const { token, user } = await client.login({
  email: 'user@example.com',
  password: 'hunter2',
});
```

### React components

```tsx
import { AuthClient, AuthForm, AuthStatus } from 'add-auth';

const client = new AuthClient({ baseUrl: 'http://localhost:3000' });

export function AuthDemo() {
  return (
    <>
      <AuthStatus client={client} />
      <AuthForm client={client} allowModeSwitch />
    </>
  );
}
```

### Vanilla JavaScript widget

```ts
import { AuthClient, createAuthWidget } from 'add-auth';

const client = new AuthClient({ baseUrl: 'http://localhost:3000' });
const container = document.getElementById('auth-root');

if (container) {
  createAuthWidget({ target: container, client });
}
```

## Demos

Example implementations are available in the `examples/` folder:

- `examples/react-demo` – React application using the provided components
- `examples/vanilla-demo` – Framework-free widget initialisation

Each demo folder contains setup instructions.

## Testing

Run the full test suite:

```bash
npm test
```

This exercises the API client, React components, and vanilla widget using Jest and Testing Library.

## Publishing to npm

The package is ready for publishing once the build artifacts are generated under `dist/`.

1. Update the version in `package.json`
2. Run `npm run build`
3. Optionally verify the package contents with `npm pack`
4. Publish with `npm publish`

The `files` and `exports` fields ensure only the compiled assets and documentation are shipped.
