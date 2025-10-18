export interface AuthWidgetOptions {
  title?: string;
  buttonLabel?: string;
  rememberMeLabel?: string;
  forgotPasswordUrl?: string | null;
  successMessage?: string;
  errorMessage?: string;
  initialEmail?: string;
  initialPassword?: string;
  onSubmit?: (values: AuthWidgetValues) => Promise<AuthWidgetSubmitResult | void> | AuthWidgetSubmitResult | void;
}

export interface AuthWidgetValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthWidgetSubmitResult {
  ok: boolean;
  message?: string;
  data?: unknown;
}

export interface AuthWidgetInstance {
  element: HTMLFormElement;
  destroy: () => void;
  setStatus: (status: 'idle' | 'loading' | 'success' | 'error', message?: string) => void;
  getValues: () => AuthWidgetValues;
}

const DEFAULT_SUCCESS_MESSAGE = 'You are now signed in.';
const DEFAULT_ERROR_MESSAGE = 'Unable to sign in with the provided credentials.';

const defaultSubmitHandler = async (
  values: AuthWidgetValues
): Promise<AuthWidgetSubmitResult> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => body?.error || body?.message)
      .catch(() => undefined);

    return { ok: false, message };
  }

  const data = await response
    .json()
    .catch(() => undefined);

  return {
    ok: true,
    message: data && typeof data === 'object' && 'message' in data ? (data as any).message : undefined,
    data,
  };
};

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; textContent?: string; attrs?: Record<string, string> } = {}
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (options.className) {
    element.className = options.className;
  }
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
};

export const createAuthWidget = (
  container: HTMLElement | string,
  options: AuthWidgetOptions = {}
): AuthWidgetInstance => {
  const target =
    typeof container === 'string'
      ? (document.getElementById(container) as HTMLElement | null)
      : container;

  if (!target) {
    throw new Error('Unable to mount auth widget: container element not found');
  }

  const mergedOptions = {
    title: 'Sign in to your account',
    buttonLabel: 'Sign In',
    rememberMeLabel: 'Remember me',
    forgotPasswordUrl: '/forgot-password',
    successMessage: DEFAULT_SUCCESS_MESSAGE,
    errorMessage: DEFAULT_ERROR_MESSAGE,
    initialEmail: '',
    initialPassword: '',
    onSubmit: defaultSubmitHandler,
    ...options,
  };

  const form = createElement('form', { className: 'aa-auth-form' });
  form.setAttribute('aria-label', mergedOptions.title);

  const fieldset = createElement('fieldset');
  form.appendChild(fieldset);

  const legend = createElement('legend', { textContent: mergedOptions.title });
  fieldset.appendChild(legend);

  const emailField = createElement('div', { className: 'aa-field' });
  const emailLabel = createElement('label', { textContent: 'Email address' });
  emailLabel.setAttribute('for', 'aa-email');
  const emailInput = createElement('input', {
    attrs: {
      id: 'aa-email',
      name: 'email',
      type: 'email',
      autocomplete: 'email',
      required: 'true',
      value: mergedOptions.initialEmail,
    },
  }) as HTMLInputElement;
  emailField.append(emailLabel, emailInput);
  fieldset.appendChild(emailField);

  const passwordField = createElement('div', { className: 'aa-field' });
  const passwordLabel = createElement('label', { textContent: 'Password' });
  passwordLabel.setAttribute('for', 'aa-password');
  const passwordInput = createElement('input', {
    attrs: {
      id: 'aa-password',
      name: 'password',
      type: 'password',
      autocomplete: 'current-password',
      required: 'true',
      value: mergedOptions.initialPassword,
    },
  }) as HTMLInputElement;
  passwordField.append(passwordLabel, passwordInput);
  fieldset.appendChild(passwordField);

  const footer = createElement('div', { className: 'aa-form-footer' });
  const rememberLabel = createElement('label', { className: 'aa-remember' });
  const rememberCheckbox = createElement('input', {
    attrs: {
      type: 'checkbox',
      name: 'rememberMe',
    },
  }) as HTMLInputElement;
  rememberCheckbox.checked = false;
  const rememberSpan = createElement('span', {
    textContent: mergedOptions.rememberMeLabel,
  });
  rememberLabel.append(rememberCheckbox, rememberSpan);
  footer.appendChild(rememberLabel);

  if (mergedOptions.forgotPasswordUrl) {
    const forgotLink = createElement('a', {
      className: 'aa-forgot',
      textContent: 'Forgot password?',
      attrs: { href: mergedOptions.forgotPasswordUrl },
    });
    footer.appendChild(forgotLink);
  }

  fieldset.appendChild(footer);

  const submitButton = createElement('button', {
    className: 'aa-submit',
    textContent: mergedOptions.buttonLabel,
  }) as HTMLButtonElement;
  submitButton.type = 'submit';
  fieldset.appendChild(submitButton);

  const successMessage = createElement('p', {
    className: 'aa-success',
  });
  successMessage.setAttribute('role', 'status');
  successMessage.style.display = 'none';

  const errorMessage = createElement('p', {
    className: 'aa-error',
  });
  errorMessage.setAttribute('role', 'alert');
  errorMessage.style.display = 'none';

  form.append(successMessage, errorMessage);

  const setStatus = (
    status: 'idle' | 'loading' | 'success' | 'error',
    message?: string
  ) => {
    const isLoading = status === 'loading';
    fieldset.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Signing in…' : mergedOptions.buttonLabel;

    successMessage.style.display = status === 'success' ? 'block' : 'none';
    errorMessage.style.display = status === 'error' ? 'block' : 'none';

    if (status === 'success') {
      successMessage.textContent = message || mergedOptions.successMessage;
    } else if (status === 'error') {
      errorMessage.textContent = message || mergedOptions.errorMessage;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const values: AuthWidgetValues = {
      email: emailInput.value,
      password: passwordInput.value,
      rememberMe: rememberCheckbox.checked,
    };

    if (!values.email || !values.password) {
      setStatus('error', 'Email and password are required.');
      return;
    }

    setStatus('loading');

    try {
      const result = await mergedOptions.onSubmit?.(values);
      const finalResult = typeof result === 'undefined' ? { ok: true } : result;
      if (finalResult.ok) {
        setStatus('success', finalResult.message);
      } else {
        setStatus('error', finalResult.message);
      }
    } catch (error) {
      setStatus('error', error instanceof Error ? error.message : undefined);
    }
  });

  const destroy = () => {
    form.remove();
  };

  const getValues = (): AuthWidgetValues => ({
    email: emailInput.value,
    password: passwordInput.value,
    rememberMe: rememberCheckbox.checked,
  });

  target.innerHTML = '';
  target.appendChild(form);

  return { element: form, destroy, setStatus, getValues };
};

export const renderAuthWidgetToString = (
  options: AuthWidgetOptions = {}
): string => {
  const title = options.title || 'Sign in to your account';
  const buttonLabel = options.buttonLabel || 'Sign In';
  const rememberMeLabel = options.rememberMeLabel || 'Remember me';
  const forgotPasswordUrl =
    typeof options.forgotPasswordUrl === 'undefined'
      ? '/forgot-password'
      : options.forgotPasswordUrl;

  const forgotLink =
    forgotPasswordUrl
      ? `<a class="aa-forgot" href="${forgotPasswordUrl}">Forgot password?</a>`
      : '';

  return `
<form class="aa-auth-form" aria-label="${title}">
  <fieldset>
    <legend>${title}</legend>
    <div class="aa-field">
      <label for="aa-email">Email address</label>
      <input id="aa-email" name="email" type="email" autocomplete="email" required value="${
        options.initialEmail || ''
      }" />
    </div>
    <div class="aa-field">
      <label for="aa-password">Password</label>
      <input id="aa-password" name="password" type="password" autocomplete="current-password" required value="${
        options.initialPassword || ''
      }" />
    </div>
    <div class="aa-form-footer">
      <label class="aa-remember">
        <input type="checkbox" name="rememberMe" />
        <span>${rememberMeLabel}</span>
      </label>
      ${forgotLink}
    </div>
    <button type="submit" class="aa-submit">${buttonLabel}</button>
  </fieldset>
  <p role="status" class="aa-success" style="display:none"></p>
  <p role="alert" class="aa-error" style="display:none"></p>
</form>
`.trim();
};
