import React, { FormEvent, useCallback, useMemo, useState } from 'react';

export interface AuthFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthFormSubmitResult {
  ok: boolean;
  message?: string;
  data?: unknown;
}

export type AuthFormSubmitHandler = (
  values: AuthFormValues
) => Promise<AuthFormSubmitResult | void> | AuthFormSubmitResult | void;

export interface AuthFormProps {
  onSubmit?: AuthFormSubmitHandler;
  title?: string;
  buttonLabel?: string;
  forgotPasswordUrl?: string;
  initialEmail?: string;
  initialPassword?: string;
  rememberMeLabel?: string;
  successMessage?: string;
  errorMessage?: string;
}

interface SubmitState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const DEFAULT_SUCCESS_MESSAGE = 'You are now signed in.';
const DEFAULT_ERROR_MESSAGE = 'Unable to sign in with the provided credentials.';

const defaultSubmitHandler: AuthFormSubmitHandler = async (values) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,
    }),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => body?.error || body?.message)
      .catch(() => undefined);

    return {
      ok: false,
      message,
    } satisfies AuthFormSubmitResult;
  }

  const data = await response
    .json()
    .catch(() => undefined);

  return {
    ok: true,
    message: data && typeof data === 'object' && 'message' in data ? (data as any).message : undefined,
    data,
  } satisfies AuthFormSubmitResult;
};

export const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit = defaultSubmitHandler,
  title = 'Sign in to your account',
  buttonLabel = 'Sign In',
  forgotPasswordUrl = '/forgot-password',
  initialEmail = '',
  initialPassword = '',
  rememberMeLabel = 'Remember me',
  successMessage = DEFAULT_SUCCESS_MESSAGE,
  errorMessage = DEFAULT_ERROR_MESSAGE,
}) => {
  const [values, setValues] = useState<AuthFormValues>({
    email: initialEmail,
    password: initialPassword,
    rememberMe: false,
  });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const disabled = useMemo(() => {
    return submitState.status === 'loading' || !values.email || !values.password;
  }, [submitState.status, values.email, values.password]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = event.target;
      setValues((previous) => ({
        ...previous,
        [name]: type === 'checkbox' ? checked : value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitState({ status: 'loading' });

      try {
        const result = await onSubmit(values);
        const finalResult: AuthFormSubmitResult =
          typeof result === 'undefined' ? { ok: true } : result;

        if (finalResult.ok) {
          setSubmitState({
            status: 'success',
            message: finalResult.message || successMessage,
          });
        } else {
          setSubmitState({
            status: 'error',
            message: finalResult.message || errorMessage,
          });
        }
      } catch (error) {
        setSubmitState({
          status: 'error',
          message:
            error instanceof Error ? error.message : errorMessage,
        });
      }
    },
    [errorMessage, onSubmit, successMessage, values]
  );

  return (
    <form onSubmit={handleSubmit} aria-label={title} className="aa-auth-form">
      <fieldset disabled={submitState.status === 'loading'}>
        <legend>{title}</legend>
        <div className="aa-field">
          <label htmlFor="aa-email">Email address</label>
          <input
            id="aa-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={handleChange}
          />
        </div>
        <div className="aa-field">
          <label htmlFor="aa-password">Password</label>
          <input
            id="aa-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={handleChange}
          />
        </div>
        <div className="aa-form-footer">
          <label className="aa-remember">
            <input
              type="checkbox"
              name="rememberMe"
              checked={values.rememberMe}
              onChange={handleChange}
            />
            <span>{rememberMeLabel}</span>
          </label>
          {forgotPasswordUrl && (
            <a className="aa-forgot" href={forgotPasswordUrl}>
              Forgot password?
            </a>
          )}
        </div>
        <button type="submit" disabled={disabled} className="aa-submit">
          {submitState.status === 'loading' ? 'Signing in…' : buttonLabel}
        </button>
      </fieldset>

      {submitState.status === 'success' && (
        <p role="status" className="aa-success">
          {submitState.message}
        </p>
      )}
      {submitState.status === 'error' && (
        <p role="alert" className="aa-error">
          {submitState.message}
        </p>
      )}
    </form>
  );
};

AuthForm.displayName = 'AuthForm';

export default AuthForm;
