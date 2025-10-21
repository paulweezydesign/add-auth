import React from 'react';
import {
  AuthProvider,
  LoginForm,
  RegisterForm,
  PasswordResetRequestForm,
  PasswordResetForm,
  LogoutButton,
  useAuth
} from 'add-auth/react';

const baseUrl = import.meta.env.VITE_AUTH_BASE_URL ?? 'http://localhost:4000';

const ProfileCard: React.FC = () => {
  const { user, status, error } = useAuth();

  return (
    <div className="card profile-card">
      <h2>Session state</h2>
      <p>Status: {status}</p>
      {error && <p role="alert">Latest error: {error}</p>}
      {user ? (
        <pre>{JSON.stringify(user, null, 2)}</pre>
      ) : (
        <p>No authenticated user.</p>
      )}
      <LogoutButton />
    </div>
  );
};

const FormsGrid: React.FC = () => (
  <div className="demo-grid">
    <div className="card">
      <h2>Login</h2>
      <LoginForm />
    </div>
    <div className="card">
      <h2>Create account</h2>
      <RegisterForm />
    </div>
    <div className="card">
      <h2>Request password reset</h2>
      <PasswordResetRequestForm description="Enter your email address to receive a reset token." />
    </div>
    <div className="card">
      <h2>Reset password</h2>
      <PasswordResetForm />
    </div>
  </div>
);

const App: React.FC = () => (
  <AuthProvider baseUrl={baseUrl} autoFetchProfile>
    <div className="demo-container">
      <h1>Add Auth React Demo</h1>
      <p>
        This demo uses the components exported from <code>add-auth/react</code> to provide a ready-made
        authentication experience.
      </p>
      <FormsGrid />
      <ProfileCard />
    </div>
  </AuthProvider>
);

export default App;
