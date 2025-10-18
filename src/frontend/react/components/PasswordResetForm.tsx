import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import type { AuthResponse, PasswordResetPayload } from '../../shared';
import { AuthClientError } from '../../shared';

export interface PasswordResetFormProps {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: AuthClientError) => void;
  submitLabel?: string;
  emailLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  tokenLabel?: string;
  className?: string;
  initialValues?: Partial<PasswordResetPayload>;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onSuccess,
  onError,
  submitLabel = 'Reset password',
  emailLabel = 'Email',
  passwordLabel = 'New password',
  confirmPasswordLabel = 'Confirm new password',
  tokenLabel = 'Reset token',
  className,
  initialValues,
}) => {
  const auth = useAuth();
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [password, setPassword] = useState(initialValues?.password ?? '');
  const [confirmPassword, setConfirmPassword] = useState(initialValues?.confirmPassword ?? '');
  const [token, setToken] = useState(initialValues?.token ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: PasswordResetPayload = {
        email,
        password,
        confirmPassword,
        token,
      };

      const response = await auth.resetPassword(payload);
      setSuccessMessage(response?.message ?? 'Password updated');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      setFormError(message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formClassName = ['add-auth-form', 'add-auth-form--password-reset', className]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      <div className="add-auth-form__field">
        <label className="add-auth-form__label">
          {tokenLabel}
          <input
            className="add-auth-form__input"
            type="text"
            name="token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            autoComplete="one-time-code"
          />
        </label>
      </div>

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
            autoComplete="new-password"
          />
        </label>
      </div>

      <div className="add-auth-form__field">
        <label className="add-auth-form__label">
          {confirmPasswordLabel}
          <input
            className="add-auth-form__input"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
          />
        </label>
      </div>

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

export default PasswordResetForm;
