import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import type { PasswordResetRequestPayload, PasswordResetRequestResult } from '../../shared';
import { AuthClientError } from '../../shared';

export interface PasswordResetRequestFormProps {
  onSuccess?: (response: PasswordResetRequestResult) => void;
  onError?: (error: AuthClientError) => void;
  submitLabel?: string;
  emailLabel?: string;
  className?: string;
  description?: string;
}

export const PasswordResetRequestForm: React.FC<PasswordResetRequestFormProps> = ({
  onSuccess,
  onError,
  submitLabel = 'Request password reset',
  emailLabel = 'Email',
  className,
  description,
}) => {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const payload: PasswordResetRequestPayload = { email };

    try {
      const response = await auth.requestPasswordReset(payload);
      setSuccessMessage(response?.message ?? 'Password reset email sent');
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

  const formClassName = ['add-auth-form', 'add-auth-form--password-reset-request', className]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={formClassName} onSubmit={handleSubmit}>
      {description && <p className="add-auth-form__description">{description}</p>}

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

export default PasswordResetRequestForm;
