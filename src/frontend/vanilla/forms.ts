import {
  AuthClient,
  AuthClientError,
  type AuthResponse,
  type LoginCredentials,
  type RegistrationPayload,
  type PasswordResetPayload,
  type PasswordResetRequestPayload,
  type PasswordResetRequestResult,
  type LogoutResult
} from '../shared';

interface FormMessages {
  error: HTMLDivElement;
  success: HTMLDivElement;
}

const createMessageElements = (): FormMessages => {
  const error = document.createElement('div');
  error.className = 'add-auth-form__error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const success = document.createElement('div');
  success.className = 'add-auth-form__success';
  success.setAttribute('role', 'status');
  success.hidden = true;

  return { error, success };
};

const showMessage = (element: HTMLDivElement, message: string | null) => {
  if (!message) {
    element.textContent = '';
    element.hidden = true;
    return;
  }

  element.textContent = message;
  element.hidden = false;
};

const createField = (
  labelText: string,
  input: HTMLInputElement,
  description?: string
): HTMLDivElement => {
  const wrapper = document.createElement('div');
  wrapper.className = 'add-auth-form__field';

  const label = document.createElement('label');
  label.className = 'add-auth-form__label';
  label.textContent = labelText;

  if (description) {
    const helper = document.createElement('span');
    helper.className = 'add-auth-form__description';
    helper.textContent = description;
    label.appendChild(helper);
  }

  label.appendChild(input);
  wrapper.appendChild(label);
  return wrapper;
};

const applyFormClassNames = (form: HTMLFormElement, classes: string[]) => {
  const className = classes.filter(Boolean).join(' ').trim();
  if (className) {
    form.className = className;
  }
};

interface BaseFormOptions<T> {
  client: AuthClient;
  className?: string;
  submitLabel?: string;
  onSuccess?: (response: T) => void;
  onError?: (error: AuthClientError) => void;
}

export interface LoginFormOptions extends BaseFormOptions<AuthResponse> {
  emailLabel?: string;
  passwordLabel?: string;
  rememberMeLabel?: string;
  showRememberMe?: boolean;
}

export interface AuthFormHandle {
  element: HTMLFormElement;
  reset: () => void;
  destroy: () => void;
}

export const createLoginForm = ({
  client,
  className,
  submitLabel = 'Login',
  emailLabel = 'Email',
  passwordLabel = 'Password',
  rememberMeLabel = 'Remember me',
  showRememberMe = true,
  onSuccess,
  onError,
}: LoginFormOptions): AuthFormHandle => {
  const form = document.createElement('form');
  applyFormClassNames(form, ['add-auth-form', 'add-auth-form--login', className ?? '']);

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.className = 'add-auth-form__input';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'current-password';
  passwordInput.className = 'add-auth-form__input';

  const rememberInput = document.createElement('input');
  rememberInput.type = 'checkbox';
  rememberInput.name = 'rememberMe';

  const rememberLabel = document.createElement('label');
  rememberLabel.className = 'add-auth-form__checkbox';
  rememberLabel.appendChild(rememberInput);
  const rememberSpan = document.createElement('span');
  rememberSpan.textContent = rememberMeLabel;
  rememberLabel.appendChild(rememberSpan);

  const messages = createMessageElements();

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = submitLabel;
  submitButton.className = 'add-auth-form__submit';

  form.appendChild(createField(emailLabel, emailInput));
  form.appendChild(createField(passwordLabel, passwordInput));
  if (showRememberMe) {
    form.appendChild(rememberLabel);
  }
  form.appendChild(messages.error);
  form.appendChild(messages.success);
  form.appendChild(submitButton);

  const submitHandler = async (event: Event) => {
    event.preventDefault();
    showMessage(messages.error, null);
    showMessage(messages.success, null);
    submitButton.disabled = true;
    submitButton.textContent = 'Loading…';

    const payload: LoginCredentials = {
      email: emailInput.value,
      password: passwordInput.value,
      rememberMe: showRememberMe ? rememberInput.checked : undefined,
    };

    try {
      const response = await client.login(payload);
      showMessage(messages.success, response?.message ?? 'Login successful');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      showMessage(messages.error, message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    }
  };

  form.addEventListener('submit', submitHandler);

  return {
    element: form,
    reset: () => {
      form.reset();
      showMessage(messages.error, null);
      showMessage(messages.success, null);
    },
    destroy: () => {
      form.removeEventListener('submit', submitHandler);
      form.remove();
    },
  };
};

export interface RegistrationFormOptions extends BaseFormOptions<AuthResponse> {
  emailLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  nameLabel?: string;
  requireName?: boolean;
}

export const createRegistrationForm = ({
  client,
  className,
  submitLabel = 'Create account',
  emailLabel = 'Email',
  passwordLabel = 'Password',
  confirmPasswordLabel = 'Confirm password',
  nameLabel = 'Name',
  requireName = false,
  onSuccess,
  onError,
}: RegistrationFormOptions): AuthFormHandle => {
  const form = document.createElement('form');
  applyFormClassNames(form, ['add-auth-form', 'add-auth-form--register', className ?? '']);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.autocomplete = 'name';
  nameInput.className = 'add-auth-form__input';

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.className = 'add-auth-form__input';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'new-password';
  passwordInput.className = 'add-auth-form__input';

  const confirmPasswordInput = document.createElement('input');
  confirmPasswordInput.type = 'password';
  confirmPasswordInput.name = 'confirmPassword';
  confirmPasswordInput.required = true;
  confirmPasswordInput.autocomplete = 'new-password';
  confirmPasswordInput.className = 'add-auth-form__input';

  const messages = createMessageElements();

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = submitLabel;
  submitButton.className = 'add-auth-form__submit';

  if (requireName) {
    nameInput.required = true;
    form.appendChild(createField(nameLabel, nameInput));
  }

  form.appendChild(createField(emailLabel, emailInput));
  form.appendChild(createField(passwordLabel, passwordInput));
  form.appendChild(createField(confirmPasswordLabel, confirmPasswordInput));
  form.appendChild(messages.error);
  form.appendChild(messages.success);
  form.appendChild(submitButton);

  const submitHandler = async (event: Event) => {
    event.preventDefault();
    showMessage(messages.error, null);
    showMessage(messages.success, null);
    submitButton.disabled = true;
    submitButton.textContent = 'Loading…';

    if (passwordInput.value !== confirmPasswordInput.value) {
      showMessage(messages.error, 'Passwords do not match');
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
      return;
    }

    const payload: RegistrationPayload = {
      email: emailInput.value,
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
    };

    if (requireName && nameInput.value) {
      payload.name = nameInput.value;
    }

    try {
      const response = await client.register(payload);
      showMessage(messages.success, response?.message ?? 'Registration successful');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      showMessage(messages.error, message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    }
  };

  form.addEventListener('submit', submitHandler);

  return {
    element: form,
    reset: () => {
      form.reset();
      showMessage(messages.error, null);
      showMessage(messages.success, null);
    },
    destroy: () => {
      form.removeEventListener('submit', submitHandler);
      form.remove();
    },
  };
};

export interface PasswordResetRequestFormOptions
  extends BaseFormOptions<PasswordResetRequestResult> {
  emailLabel?: string;
  description?: string;
}

export const createPasswordResetRequestForm = ({
  client,
  className,
  submitLabel = 'Request password reset',
  emailLabel = 'Email',
  description,
  onSuccess,
  onError,
}: PasswordResetRequestFormOptions): AuthFormHandle => {
  const form = document.createElement('form');
  applyFormClassNames(form, [
    'add-auth-form',
    'add-auth-form--password-reset-request',
    className ?? '',
  ]);

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.className = 'add-auth-form__input';

  const messages = createMessageElements();

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = submitLabel;
  submitButton.className = 'add-auth-form__submit';

  if (description) {
    const paragraph = document.createElement('p');
    paragraph.className = 'add-auth-form__description';
    paragraph.textContent = description;
    form.appendChild(paragraph);
  }

  form.appendChild(createField(emailLabel, emailInput));
  form.appendChild(messages.error);
  form.appendChild(messages.success);
  form.appendChild(submitButton);

  const submitHandler = async (event: Event) => {
    event.preventDefault();
    showMessage(messages.error, null);
    showMessage(messages.success, null);
    submitButton.disabled = true;
    submitButton.textContent = 'Loading…';

    const payload: PasswordResetRequestPayload = { email: emailInput.value };

    try {
      const response = await client.requestPasswordReset(payload);
      showMessage(messages.success, response?.message ?? 'Password reset email sent');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      showMessage(messages.error, message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    }
  };

  form.addEventListener('submit', submitHandler);

  return {
    element: form,
    reset: () => {
      form.reset();
      showMessage(messages.error, null);
      showMessage(messages.success, null);
    },
    destroy: () => {
      form.removeEventListener('submit', submitHandler);
      form.remove();
    },
  };
};

export interface PasswordResetFormOptions extends BaseFormOptions<AuthResponse> {
  emailLabel?: string;
  passwordLabel?: string;
  confirmPasswordLabel?: string;
  tokenLabel?: string;
}

export const createPasswordResetForm = ({
  client,
  className,
  submitLabel = 'Reset password',
  emailLabel = 'Email',
  passwordLabel = 'New password',
  confirmPasswordLabel = 'Confirm new password',
  tokenLabel = 'Reset token',
  onSuccess,
  onError,
}: PasswordResetFormOptions): AuthFormHandle => {
  const form = document.createElement('form');
  applyFormClassNames(form, ['add-auth-form', 'add-auth-form--password-reset', className ?? '']);

  const tokenInput = document.createElement('input');
  tokenInput.type = 'text';
  tokenInput.name = 'token';
  tokenInput.required = true;
  tokenInput.autocomplete = 'one-time-code';
  tokenInput.className = 'add-auth-form__input';

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailInput.className = 'add-auth-form__input';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'new-password';
  passwordInput.className = 'add-auth-form__input';

  const confirmPasswordInput = document.createElement('input');
  confirmPasswordInput.type = 'password';
  confirmPasswordInput.name = 'confirmPassword';
  confirmPasswordInput.required = true;
  confirmPasswordInput.autocomplete = 'new-password';
  confirmPasswordInput.className = 'add-auth-form__input';

  const messages = createMessageElements();

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = submitLabel;
  submitButton.className = 'add-auth-form__submit';

  form.appendChild(createField(tokenLabel, tokenInput));
  form.appendChild(createField(emailLabel, emailInput));
  form.appendChild(createField(passwordLabel, passwordInput));
  form.appendChild(createField(confirmPasswordLabel, confirmPasswordInput));
  form.appendChild(messages.error);
  form.appendChild(messages.success);
  form.appendChild(submitButton);

  const submitHandler = async (event: Event) => {
    event.preventDefault();
    showMessage(messages.error, null);
    showMessage(messages.success, null);
    submitButton.disabled = true;
    submitButton.textContent = 'Loading…';

    if (passwordInput.value !== confirmPasswordInput.value) {
      showMessage(messages.error, 'Passwords do not match');
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
      return;
    }

    const payload: PasswordResetPayload = {
      token: tokenInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
    };

    try {
      const response = await client.resetPassword(payload);
      showMessage(messages.success, response?.message ?? 'Password updated');
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      showMessage(messages.error, message);
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    }
  };

  form.addEventListener('submit', submitHandler);

  return {
    element: form,
    reset: () => {
      form.reset();
      showMessage(messages.error, null);
      showMessage(messages.success, null);
    },
    destroy: () => {
      form.removeEventListener('submit', submitHandler);
      form.remove();
    },
  };
};

export interface LogoutButtonOptions extends BaseFormOptions<LogoutResult> {
  label?: string;
  loggingOutLabel?: string;
}

export const createLogoutButton = ({
  client,
  className,
  label = 'Log out',
  loggingOutLabel = 'Logging out…',
  onError,
  onSuccess,
}: LogoutButtonOptions): { element: HTMLDivElement; destroy: () => void } => {
  const wrapper = document.createElement('div');
  wrapper.className = ['add-auth-logout', className ?? ''].filter(Boolean).join(' ');

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = 'add-auth-logout__button';

  const errorMessage = document.createElement('div');
  errorMessage.className = 'add-auth-logout__error';
  errorMessage.setAttribute('role', 'alert');
  errorMessage.hidden = true;

  const clickHandler = async () => {
    button.disabled = true;
    button.textContent = loggingOutLabel;
    errorMessage.hidden = true;

    try {
      const response = await client.logout();
      button.textContent = label;
      button.disabled = false;
      onSuccess?.(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log out';
      errorMessage.textContent = message;
      errorMessage.hidden = false;
      button.textContent = label;
      button.disabled = false;
      if (error instanceof AuthClientError) {
        onError?.(error);
      }
    }
  };

  button.addEventListener('click', clickHandler);

  wrapper.appendChild(button);
  wrapper.appendChild(errorMessage);

  return {
    element: wrapper,
    destroy: () => {
      button.removeEventListener('click', clickHandler);
      wrapper.remove();
    },
  };
};
