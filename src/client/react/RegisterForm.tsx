import React, { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';
import { AuthResponse } from '../shared/types';

export interface RegisterFormProps {
  title?: string;
  submitLabel?: string;
  className?: string;
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: Error) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  title = 'Create your account',
  submitLabel = 'Sign up',
  className,
  onSuccess,
  onError
}) => {
  const { register, status, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setSuccessMessage(null);

    try {
      const response = await register({ email, password, username });
      setSuccessMessage(response.message ?? 'Account created successfully');
      onSuccess?.(response);
    } catch (err) {
      const message = err instanceof Error ? err : new Error('Registration failed');
      onError?.(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} aria-label="authentication registration form">
      <fieldset disabled={status === 'loading'}>
        <legend>{title}</legend>
        <div>
          <label htmlFor="add-auth-register-email">Email</label>
          <input
            id="add-auth-register-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="add-auth-register-username">Username</label>
          <input
            id="add-auth-register-username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="add-auth-register-password">Password</label>
          <input
            id="add-auth-register-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit">{status === 'loading' ? 'Creating account…' : submitLabel}</button>
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
