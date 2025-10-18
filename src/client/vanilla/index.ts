import { createAuthClient } from '../shared/createAuthClient';
import {
  AuthClient,
  AuthClientOptions,
  AuthResponse,
  LoginCredentials,
  RegistrationPayload
} from '../shared/types';

interface BaseFormOptions extends AuthClientOptions {
  container: HTMLElement;
  className?: string;
  client?: AuthClient;
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: Error) => void;
}

export interface LoginFormOptions extends BaseFormOptions {
  showRememberMe?: boolean;
}

export interface RegisterFormOptions extends BaseFormOptions {}

interface RenderResult {
  container: HTMLElement;
  form: HTMLFormElement;
  client: AuthClient;
  dispose(): void;
}

function ensureContainer(element: HTMLElement | null | undefined): HTMLElement {
  if (!element) {
    throw new Error('A container element is required to render the form');
  }

  return element;
}

function createMessageElement() {
  const message = document.createElement('p');
  message.hidden = true;
  message.dataset.status = 'idle';
  return message;
}

function updateMessage(element: HTMLParagraphElement, text: string | null, status: 'success' | 'error') {
  if (!text) {
    element.hidden = true;
    element.textContent = '';
    element.dataset.status = 'idle';
    element.removeAttribute('role');
    return;
  }

  element.hidden = false;
  element.textContent = text;
  element.dataset.status = status;
  element.setAttribute('role', status === 'error' ? 'alert' : 'status');
}

function withDisabledState<T>(form: HTMLFormElement, callback: () => Promise<T>) {
  const previous = form.getAttribute('aria-busy');
  form.setAttribute('aria-busy', 'true');
  Array.from(form.elements).forEach((element) => {
    if ('disabled' in element) {
      (element as HTMLInputElement).disabled = true;
    }
  });

  return callback()
    .finally(() => {
      if (previous) {
        form.setAttribute('aria-busy', previous);
      } else {
        form.removeAttribute('aria-busy');
      }
      Array.from(form.elements).forEach((element) => {
        if ('disabled' in element) {
          (element as HTMLInputElement).disabled = false;
        }
      });
    });
}

function resolveClient(options: BaseFormOptions): AuthClient {
  if (options.client) {
    return options.client;
  }

  return createAuthClient({
    baseUrl: options.baseUrl,
    fetcher: options.fetcher,
    storage: options.storage,
    storageKeyPrefix: options.storageKeyPrefix
  });
}

function collectCredentials(form: HTMLFormElement): LoginCredentials {
  const formData = new FormData(form);
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  const rememberMe = formData.get('rememberMe') === 'on';

  return { email, password, rememberMe };
}

function collectRegistration(form: HTMLFormElement): RegistrationPayload {
  const formData = new FormData(form);
  const email = (formData.get('email') as string) ?? '';
  const password = (formData.get('password') as string) ?? '';
  const username = (formData.get('username') as string) ?? '';

  return { email, password, username };
}

export function renderLoginForm(options: LoginFormOptions): RenderResult {
  const container = ensureContainer(options.container);
  const client = resolveClient(options);

  const form = document.createElement('form');
  form.className = options.className ?? '';
  form.setAttribute('aria-label', 'authentication login form');

  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = 'Sign in to your account';
  fieldset.appendChild(legend);

  const emailLabel = document.createElement('label');
  emailLabel.setAttribute('for', 'add-auth-vanilla-email');
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.id = 'add-auth-vanilla-email';
  emailInput.name = 'email';
  emailInput.type = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailLabel.appendChild(emailInput);
  fieldset.appendChild(emailLabel);

  const passwordLabel = document.createElement('label');
  passwordLabel.setAttribute('for', 'add-auth-vanilla-password');
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.id = 'add-auth-vanilla-password';
  passwordInput.name = 'password';
  passwordInput.type = 'password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'current-password';
  passwordLabel.appendChild(passwordInput);
  fieldset.appendChild(passwordLabel);

  if (options.showRememberMe !== false) {
    const rememberWrapper = document.createElement('label');
    rememberWrapper.setAttribute('for', 'add-auth-vanilla-remember');
    rememberWrapper.textContent = 'Remember me';
    const rememberInput = document.createElement('input');
    rememberInput.id = 'add-auth-vanilla-remember';
    rememberInput.name = 'rememberMe';
    rememberInput.type = 'checkbox';
    rememberWrapper.prepend(rememberInput);
    fieldset.appendChild(rememberWrapper);
  }

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Sign in';
  fieldset.appendChild(submitButton);

  form.appendChild(fieldset);

  const message = createMessageElement();
  form.appendChild(message);

  const submitHandler = async (event: Event) => {
    event.preventDefault();
    updateMessage(message, null, 'success');

    await withDisabledState(form, async () => {
      try {
        const response = await client.login(collectCredentials(form));
        updateMessage(message, response.message ?? 'Logged in successfully', 'success');
        options.onSuccess?.(response);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Login failed');
        updateMessage(message, err.message, 'error');
        options.onError?.(err);
      }
    });
  };

  form.addEventListener('submit', submitHandler);

  container.innerHTML = '';
  container.append(form);

  return {
    container,
    form,
    client,
    dispose() {
      form.removeEventListener('submit', submitHandler);
      form.remove();
    }
  };
}

export function renderRegisterForm(options: RegisterFormOptions): RenderResult {
  const container = ensureContainer(options.container);
  const client = resolveClient(options);

  const form = document.createElement('form');
  form.className = options.className ?? '';
  form.setAttribute('aria-label', 'authentication registration form');

  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = 'Create your account';
  fieldset.appendChild(legend);

  const emailLabel = document.createElement('label');
  emailLabel.setAttribute('for', 'add-auth-vanilla-register-email');
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.id = 'add-auth-vanilla-register-email';
  emailInput.name = 'email';
  emailInput.type = 'email';
  emailInput.required = true;
  emailInput.autocomplete = 'email';
  emailLabel.appendChild(emailInput);
  fieldset.appendChild(emailLabel);

  const usernameLabel = document.createElement('label');
  usernameLabel.setAttribute('for', 'add-auth-vanilla-register-username');
  usernameLabel.textContent = 'Username';
  const usernameInput = document.createElement('input');
  usernameInput.id = 'add-auth-vanilla-register-username';
  usernameInput.name = 'username';
  usernameInput.type = 'text';
  usernameInput.required = true;
  usernameInput.autocomplete = 'username';
  usernameLabel.appendChild(usernameInput);
  fieldset.appendChild(usernameLabel);

  const passwordLabel = document.createElement('label');
  passwordLabel.setAttribute('for', 'add-auth-vanilla-register-password');
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.id = 'add-auth-vanilla-register-password';
  passwordInput.name = 'password';
  passwordInput.type = 'password';
  passwordInput.required = true;
  passwordInput.autocomplete = 'new-password';
  passwordLabel.appendChild(passwordInput);
  fieldset.appendChild(passwordLabel);

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Create account';
  fieldset.appendChild(submitButton);

  form.appendChild(fieldset);

  const message = createMessageElement();
  form.appendChild(message);

  const submitHandler = async (event: Event) => {
    event.preventDefault();
    updateMessage(message, null, 'success');

    await withDisabledState(form, async () => {
      try {
        const response = await client.register(collectRegistration(form));
        updateMessage(message, response.message ?? 'Account created successfully', 'success');
        options.onSuccess?.(response);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Registration failed');
        updateMessage(message, err.message, 'error');
        options.onError?.(err);
      }
    });
  };

  form.addEventListener('submit', submitHandler);

  container.innerHTML = '';
  container.append(form);

  return {
    container,
    form,
    client,
    dispose() {
      form.removeEventListener('submit', submitHandler);
      form.remove();
    }
  };
}

export { createAuthClient };
