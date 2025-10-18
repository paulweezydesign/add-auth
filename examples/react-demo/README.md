# React Demo

This demo shows how to use the `add-auth` package inside a React application. It uses the exported `AuthClient`, `AuthForm`, and `AuthStatus` components to provide a ready-made authentication experience.

## Running the demo locally

1. Install dependencies in the repository root:

   ```bash
   npm install
   ```

2. Build the package so the compiled files are available:

   ```bash
   npm run build
   ```

3. Create a React sandbox (for example with Vite or Create React App) and link this package locally:

   ```bash
   cd examples/react-demo
   npm install
   npm link ../..
   ```

   Alternatively, copy `App.tsx` and `index.tsx` into your own project.

4. Start your React dev server and make sure the authentication API is running. By default the demo expects the API at `http://localhost:3000`. You can override this by setting `REACT_APP_AUTH_API_URL` before starting the app.

## What the demo includes

- Authentication status indicator that polls periodically
- Login and registration form with basic validation
- Friendly success and error states out of the box

## Customisation tips

- Pass a preconfigured `AuthClient` to change the API base URL or provide a custom `fetch` implementation
- Use the `onSuccess` and `onError` props on `AuthForm` to integrate with your state management or routing
- Replace the inline styles with your design system or CSS framework
