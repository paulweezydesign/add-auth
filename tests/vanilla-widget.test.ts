import { createAuthWidget } from '../src/components/vanilla/createAuthWidget';
import type { AuthClientInterface, AuthResponse } from '../src/frontend/authClient';

const createClient = (overrides: Partial<AuthClientInterface> = {}): AuthClientInterface => ({
  login: jest.fn(async () => ({} as AuthResponse)) as AuthClientInterface['login'],
  register: jest.fn(async () => ({} as AuthResponse)) as AuthClientInterface['register'],
  requestPasswordReset: jest.fn(async () => ({} as AuthResponse)) as AuthClientInterface['requestPasswordReset'],
  resetPassword: jest.fn(async () => ({} as AuthResponse)) as AuthClientInterface['resetPassword'],
  logout: jest.fn(async () => {}) as AuthClientInterface['logout'],
  getProfile: jest.fn(async () => ({} as AuthResponse)) as AuthClientInterface['getProfile'],
  ...overrides,
});

describe('createAuthWidget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('submits login details with the provided client', async () => {
    const login: AuthClientInterface['login'] = jest.fn(async () => ({
      message: 'Success',
      user: { email: 'user@example.com' },
    }));
    const client = createClient({ login });

    const target = document.createElement('div');
    document.body.appendChild(target);

    createAuthWidget({ target, client, allowModeSwitch: false });

    const emailInput = target.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = target.querySelector('input[name="password"]') as HTMLInputElement;
    const form = target.querySelector('form');

    emailInput.value = 'user@example.com';
    passwordInput.value = 'secret';

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitForMicrotask();

    expect(login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });

    expect(target.querySelector('[data-testid="auth-status"]')?.textContent).toContain('Success');
  });

  it('switches modes and uses register flow', async () => {
    const register: AuthClientInterface['register'] = jest.fn(async () => ({
      message: 'Registered',
    }));
    const client = createClient({ register });

    const target = document.createElement('div');
    document.body.appendChild(target);

    const widget = createAuthWidget({ target, client });

    const toggle = target.querySelector('[data-testid="auth-toggle"]') as HTMLButtonElement;
    toggle.click();

    const emailInput = target.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = target.querySelector('input[name="password"]') as HTMLInputElement;
    const nameInput = target.querySelector('input[name="name"]') as HTMLInputElement;

    emailInput.value = 'new@example.com';
    passwordInput.value = 'register';
    nameInput.value = 'Register User';

    const form = target.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitForMicrotask();

    expect(register).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'register',
      name: 'Register User',
    });

    expect(target.querySelector('[data-testid="auth-status"]')?.textContent).toContain('Registered');

    widget.destroy();
    expect(target.childElementCount).toBe(0);
  });
});

async function waitForMicrotask() {
  await Promise.resolve();
  await Promise.resolve();
}
