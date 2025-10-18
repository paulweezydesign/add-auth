import type {
  AuthClientInterface,
  AuthCredentials,
  AuthResponse,
} from '../../frontend/authClient';

export type AuthWidgetMode = 'login' | 'register';

export interface AuthWidgetOptions {
  target: HTMLElement;
  client: AuthClientInterface;
  mode?: AuthWidgetMode;
  title?: string;
  allowModeSwitch?: boolean;
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: unknown) => void;
}

export interface AuthWidgetHandle {
  setMode: (mode: AuthWidgetMode) => void;
  destroy: () => void;
}

const defaultTitle: Record<AuthWidgetMode, string> = {
  login: 'Sign in to your account',
  register: 'Create a new account',
};

export function createAuthWidget(options: AuthWidgetOptions): AuthWidgetHandle {
  const {
    target,
    client,
    mode: initialMode = 'login',
    title,
    allowModeSwitch = true,
    onSuccess,
    onError,
  } = options;

  if (!target) {
    throw new Error('createAuthWidget requires a target element.');
  }

  const documentRef = target.ownerDocument || document;
  const container = documentRef.createElement('div');
  container.className = 'add-auth-widget';

  const form = documentRef.createElement('form');
  form.className = 'add-auth-widget__form';

  const heading = documentRef.createElement('h2');
  heading.className = 'add-auth-widget__title';
  form.appendChild(heading);

  const emailLabel = documentRef.createElement('label');
  emailLabel.textContent = 'Email';
  emailLabel.htmlFor = 'add-auth-email';
  form.appendChild(emailLabel);

  const emailInput = documentRef.createElement('input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.id = 'add-auth-email';
  emailInput.autocomplete = 'email';
  emailInput.required = true;
  form.appendChild(emailInput);

  const nameLabel = documentRef.createElement('label');
  nameLabel.textContent = 'Name';
  nameLabel.htmlFor = 'add-auth-name';

  const nameInput = documentRef.createElement('input');
  nameInput.id = 'add-auth-name';
  nameInput.name = 'name';
  nameInput.placeholder = 'Jane Doe';

  const passwordLabel = documentRef.createElement('label');
  passwordLabel.textContent = 'Password';
  passwordLabel.htmlFor = 'add-auth-password';
  form.appendChild(passwordLabel);

  const passwordInput = documentRef.createElement('input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.id = 'add-auth-password';
  passwordInput.autocomplete = 'current-password';
  passwordInput.required = true;
  form.appendChild(passwordInput);

  const submitButton = documentRef.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Sign in';
  submitButton.dataset.testid = 'auth-submit';
  form.appendChild(submitButton);

  const toggleButton = documentRef.createElement('button');
  toggleButton.type = 'button';
  toggleButton.className = 'add-auth-widget__toggle';
  toggleButton.textContent = 'Need an account? Sign up';
  toggleButton.dataset.testid = 'auth-toggle';

  const statusParagraph = documentRef.createElement('p');
  statusParagraph.className = 'add-auth-widget__status';
  statusParagraph.dataset.testid = 'auth-status';

  const errorParagraph = documentRef.createElement('p');
  errorParagraph.className = 'add-auth-widget__error';
  errorParagraph.dataset.testid = 'auth-error';
  errorParagraph.setAttribute('role', 'alert');

  const renderMode = (mode: AuthWidgetMode) => {
    heading.textContent = title ?? defaultTitle[mode];
    submitButton.textContent = mode === 'login' ? 'Sign in' : 'Create account';
    passwordInput.autocomplete = mode === 'login' ? 'current-password' : 'new-password';

    if (mode === 'register') {
      if (!nameLabel.isConnected) {
        form.insertBefore(nameLabel, passwordLabel);
      }
      if (!nameInput.isConnected) {
        form.insertBefore(nameInput, passwordLabel);
      }
      if (allowModeSwitch) {
        toggleButton.textContent = 'Already have an account? Sign in';
      }
    } else {
      if (nameLabel.isConnected) {
        form.removeChild(nameLabel);
      }
      if (nameInput.isConnected) {
        form.removeChild(nameInput);
      }
      if (allowModeSwitch) {
        toggleButton.textContent = 'Need an account? Sign up';
      }
    }
  };

  let currentMode: AuthWidgetMode = initialMode;
  renderMode(currentMode);

  const setStatus = (message: string | null) => {
    if (message) {
      statusParagraph.textContent = message;
      if (!statusParagraph.isConnected) {
        form.appendChild(statusParagraph);
      }
    } else if (statusParagraph.isConnected) {
      form.removeChild(statusParagraph);
    }
  };

  const setError = (message: string | null) => {
    if (message) {
      errorParagraph.textContent = message;
      if (!errorParagraph.isConnected) {
        form.appendChild(errorParagraph);
      }
    } else if (errorParagraph.isConnected) {
      form.removeChild(errorParagraph);
    }
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    submitButton.disabled = true;
    setStatus(null);
    setError(null);

    const payload: AuthCredentials = {
      email: emailInput.value,
      password: passwordInput.value,
      ...(currentMode === 'register' && nameInput.value ? { name: nameInput.value } : {}),
    };

    try {
      const response = currentMode === 'register'
        ? await client.register(payload)
        : await client.login(payload);

      setStatus(response.message ?? 'Authentication successful');
      onSuccess?.(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      onError?.(err);
    } finally {
      submitButton.disabled = false;
    }
  };

  const handleToggle = () => {
    currentMode = currentMode === 'login' ? 'register' : 'login';
    renderMode(currentMode);
    setStatus(null);
    setError(null);
  };

  form.addEventListener('submit', handleSubmit);

  if (allowModeSwitch) {
    form.appendChild(toggleButton);
    toggleButton.addEventListener('click', handleToggle);
  }

  container.appendChild(form);
  target.innerHTML = '';
  target.appendChild(container);

  return {
    setMode: (mode: AuthWidgetMode) => {
      currentMode = mode;
      renderMode(currentMode);
      setStatus(null);
      setError(null);
    },
    destroy: () => {
      form.removeEventListener('submit', handleSubmit);
      if (allowModeSwitch) {
        toggleButton.removeEventListener('click', handleToggle);
      }
      if (container.isConnected) {
        container.remove();
      }
    },
  };
}
