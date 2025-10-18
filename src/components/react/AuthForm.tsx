import React, { useCallback, useMemo, useState } from 'react';
import type {
  AuthClientInterface,
  AuthCredentials,
  AuthResponse,
} from '../../frontend/authClient';

export type AuthMode = 'login' | 'register';

export interface AuthFormProps {
  client: AuthClientInterface;
  mode?: AuthMode;
  title?: string;
  allowModeSwitch?: boolean;
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: unknown) => void;
}

const defaultTitle: Record<AuthMode, string> = {
  login: 'Sign in to your account',
  register: 'Create a new account',
};

export const AuthForm: React.FC<AuthFormProps> = ({
  client,
  mode = 'login',
  title,
  allowModeSwitch = true,
  onSuccess,
  onError,
}) => {
  const [formMode, setFormMode] = useState<AuthMode>(mode);
  const [credentials, setCredentials] = useState<AuthCredentials>({
    email: '',
    password: '',
  });
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const heading = useMemo(() => title ?? defaultTitle[formMode], [formMode, title]);

  const handleChange = useCallback(<T extends keyof AuthCredentials>(field: T, value: AuthCredentials[T]) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    setError(null);

    try {
      const payload: AuthCredentials = {
        email: credentials.email,
        password: credentials.password,
        ...(formMode === 'register' ? { name } : {}),
      };

      const response = formMode === 'register'
        ? await client.register(payload)
        : await client.login(payload);

      setStatus(response.message ?? 'Authentication successful');
      onSuccess?.(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  }, [client, credentials.email, credentials.password, formMode, name, onError, onSuccess]);

  const toggleMode = useCallback(() => {
    setFormMode((current) => (current === 'login' ? 'register' : 'login'));
    setStatus(null);
    setError(null);
  }, []);

  return (
    <div className="add-auth-form" data-testid="auth-form" aria-live="polite">
      <form onSubmit={handleSubmit}>
        <h2>{heading}</h2>
        <label htmlFor="add-auth-email">Email</label>
        <input
          id="add-auth-email"
          name="email"
          type="email"
          autoComplete="email"
          value={credentials.email}
          onChange={(event) => handleChange('email', event.target.value)}
          required
        />

        {formMode === 'register' && (
          <>
            <label htmlFor="add-auth-name">Name</label>
            <input
              id="add-auth-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
            />
          </>
        )}

        <label htmlFor="add-auth-password">Password</label>
        <input
          id="add-auth-password"
          name="password"
          type="password"
          autoComplete={formMode === 'login' ? 'current-password' : 'new-password'}
          value={credentials.password}
          onChange={(event) => handleChange('password', event.target.value)}
          required
        />

        <button type="submit" disabled={submitting} data-testid="auth-submit">
          {submitting ? 'Please wait…' : formMode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {allowModeSwitch && (
          <button
            type="button"
            onClick={toggleMode}
            className="add-auth-toggle"
            data-testid="auth-toggle"
          >
            {formMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        )}

        {status && (
          <p className="add-auth-status" data-testid="auth-status">
            {status}
          </p>
        )}

        {error && (
          <p className="add-auth-error" role="alert" data-testid="auth-error">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

AuthForm.displayName = 'AuthForm';
