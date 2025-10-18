# Vanilla JavaScript Demo

This demo illustrates how to use the `add-auth` package in a plain browser environment without React. The `createAuthWidget` helper renders the same authentication experience with zero framework dependencies.

## Running the demo locally

1. Install dependencies and build the library from the repository root:

   ```bash
   npm install
   npm run build
   ```

2. Serve the demo with any static file server. For example:

   ```bash
   npx http-server examples/vanilla-demo -o
   ```

   Make sure the authentication API is running on `http://localhost:3000`. Adjust the base URL in `index.ts` if necessary.

3. Open the generated page and interact with the login/register widget mounted inside the element with the id `auth-root`.

## Customisation tips

- Provide your own container element and styles to match your application
- Use the `onSuccess` and `onError` callbacks to integrate with your state management
- Swap the `fetch` implementation passed to `AuthClient` for environments that require polyfills
