import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import type { AuthResponse, RegistrationPayload } from '../../shared';
import { AuthClientError } from '../../shared';

export interface RegisterFormProps {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: AuthClientError) => void;
  submitLabel?: string;
  emailLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  nameLabel?: string;
  requireName?: boolean;
  className?: string;
  initialValues?: Partial<RegistrationPayload>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  submitLabel = 'Create account',
  emailLabel = 'Email',
  passwordLabel = 'Password',
  confirmPasswordLabel = 'Confirm password',
  nameLabel = 'Name',
  requireName = false,
  className,
  initialValues,
}) => {
  const auth = useAuth();
  const [email, setEmail] = useState(initialValues?.email ?? '');
  const [password, setPassword] = useState(initialValues?.password ?? '');
  const [confirmPassword, setConfirmPassword] = useState(initialValues?.confirmPassword ?? '');
  const [name, setName] = useState((initialValues?.name as string | undefined) ?? '');
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
      const payload: RegistrationPayload = {
        email,
        password,
        confirmPassword,
      };

      if (name) {
        payload.name = name;
      }

      const response = await auth.register(payload);
      setSuccessMessage(response?.message ?? 'Registration successful');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setFormError(message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formClassName = ['add-auth-form', 'add-auth-form--register', className]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      {requireName && (
        <div className="add-auth-form__field">
          <label className="add-auth-form__label">
            {nameLabel}
            <input
              className="add-auth-form__input"
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required={requireName}
              autoComplete="name"
            />
          </label>
        </div>
      )}

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

export default RegisterForm;
