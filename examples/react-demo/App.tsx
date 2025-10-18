import React, { useMemo } from 'react';
import { AuthClient, AuthForm, AuthStatus } from '../../src';

const DEFAULT_API_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:3000';

const App: React.FC = () => {
  const client = useMemo(() => new AuthClient({ baseUrl: DEFAULT_API_URL }), []);

  return (
    <main style={{
      maxWidth: 420,
      margin: '2rem auto',
      padding: '2rem',
      border: '1px solid #ccc',
      borderRadius: '0.75rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <AuthStatus client={client} pollIntervalMs={15000} />
      <AuthForm client={client} allowModeSwitch />
    </main>
  );
};

export default App;
