import React, { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';
import { AuthResponse } from '../shared/types';

export interface LoginFormProps {
  title?: string;
  submitLabel?: string;
  showRememberMe?: boolean;
  className?: string;
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: Error) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  title = 'Sign in to your account',
  submitLabel = 'Sign in',
  showRememberMe = true,
  className,
  onSuccess,
  onError
}) => {
  const { login, status, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSuccessMessage(null);

    try {
      const response = await login({ email, password, rememberMe });
      setSuccessMessage(response.message ?? 'Logged in successfully');
      onSuccess?.(response);
    } catch (err) {
      const message = err instanceof Error ? err : new Error('Login failed');
      onError?.(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} aria-label="authentication login form">
      <fieldset disabled={status === 'loading'}>
        <legend>{title}</legend>
        <div>
          <label htmlFor="add-auth-email">Email</label>
          <input
            id="add-auth-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="add-auth-password">Password</label>
          <input
            id="add-auth-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {showRememberMe && (
          <div>
            <label htmlFor="add-auth-remember">
              <input
                id="add-auth-remember"
                name="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />{' '}
              Remember me
            </label>
          </div>
        )}
        <button type="submit">{status === 'loading' ? 'Signing in…' : submitLabel}</button>
      </fieldset>
      {error && (
        <p role="alert" data-status="error">
          {error}
        </p>
      )}
      {successMessage && (
        <p role="status" data-status="success">
          {successMessage}
        </p>
      )}
    </form>
  );
};
