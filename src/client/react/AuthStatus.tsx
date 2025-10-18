import React from 'react';
import { useAuth } from './AuthProvider';

export interface AuthStatusProps {
  className?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ className }) => {
  const { status, user, tokens, error } = useAuth();

  return (
    <section className={className} aria-live="polite" data-testid="auth-status">
      <h2>Authentication status</h2>
      <dl>
        <div>
          <dt>Status</dt>
          <dd data-field="status" data-testid="auth-status-value">
            {status}
          </dd>
        </div>
        <div>
          <dt>User</dt>
          <dd data-field="user" data-testid="auth-user-value">
            {user ? user.email : 'Guest'}
          </dd>
        </div>
        <div>
          <dt>Access token</dt>
          <dd data-field="token" data-testid="auth-token-value">
            {tokens?.accessToken ? 'Available' : 'None'}
          </dd>
        </div>
      </dl>
      {error && (
        <p role="alert" data-status="error">
          {error}
        </p>
      )}
    </section>
  );
};
