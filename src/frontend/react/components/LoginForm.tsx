import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import type { AuthResponse } from '../../shared';
import { AuthClientError } from '../../shared';

export interface LoginFormProps {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: AuthClientError) => void;
  submitLabel?: string;
  emailLabel?: string;
  passwordLabel?: string;
  rememberMeLabel?: string;
  showRememberMe?: boolean;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  submitLabel = 'Login',
  emailLabel = 'Email',
  passwordLabel = 'Password',
  rememberMeLabel = 'Remember me',
  showRememberMe = true,
  className,
}) => {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await auth.login({ email, password, rememberMe });
      setSuccessMessage(response?.message ?? 'Login successful');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setFormError(message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formClassName = ['add-auth-form', 'add-auth-form--login', className]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      <div className="add-auth-form__field">
        <label className="add-auth-form__label">
          {emailLabel}
          <input
            className="add-auth-form__input"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
      </div>

      <div className="add-auth-form__field">
        <label className="add-auth-form__label">
          {passwordLabel}
          <input
            className="add-auth-form__input"
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
      </div>

      {showRememberMe && (
        <label className="add-auth-form__checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          <span>{rememberMeLabel}</span>
        </label>
      )}

      {(formError || auth.error) && (
        <div className="add-auth-form__error" role="alert">
          {formError ?? auth.error}
        </div>
      )}

      {successMessage && (
        <div className="add-auth-form__success" role="status">
          {successMessage}
        </div>
      )}

      <button
        className="add-auth-form__submit"
        type="submit"
        disabled={isSubmitting || auth.status === 'loading'}
      >
        {isSubmitting || auth.status === 'loading' ? 'Loading…' : submitLabel}
      </button>
    </form>
  );
};

export default LoginForm;
