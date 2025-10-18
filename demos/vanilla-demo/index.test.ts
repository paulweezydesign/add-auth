import { bootstrapVanillaDemo } from './index';

describe('Vanilla JS demo', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      (global.fetch as typeof fetch | undefined) = originalFetch;
    }
  });

  const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('renders login and registration forms that call the API', async () => {
    const mockFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      const jsonResponse = (data: unknown, initResponse: ResponseInit = { status: 200 }) =>
        new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
          ...initResponse
        });

      if (url.endsWith('/login')) {
        return jsonResponse({
          message: 'Logged in via vanilla demo',
          tokens: { accessToken: 'token', refreshToken: 'refresh-token' },
          user: { id: '1', email: 'demo@example.com' }
        });
      }

      if (url.endsWith('/register')) {
        return jsonResponse({
          message: 'Registered via vanilla demo',
          tokens: { accessToken: 'token2', refreshToken: 'refresh-token-2' },
          user: { id: '2', email: 'new@example.com' }
        });
      }

      return jsonResponse({});
    });

    jest.spyOn(global, 'fetch').mockImplementation(mockFetch as typeof fetch);

    const root = document.createElement('div');
    document.body.appendChild(root);

    const { loginForm, registerForm } = bootstrapVanillaDemo(root);

    const loginEmail = loginForm.form.querySelector('input[name="email"]') as HTMLInputElement;
    const loginPassword = loginForm.form.querySelector('input[name="password"]') as HTMLInputElement;
    loginEmail.value = 'demo@example.com';
    loginPassword.value = 'password123';
    loginForm.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();
    await flushPromises();

    const loginMessage = loginForm.form.querySelector('p[data-status]');
    expect(loginMessage?.textContent).toContain('Logged in via vanilla demo');

    const registerEmail = registerForm.form.querySelector('input[name="email"]') as HTMLInputElement;
    const registerUsername = registerForm.form.querySelector('input[name="username"]') as HTMLInputElement;
    const registerPassword = registerForm.form.querySelector('input[name="password"]') as HTMLInputElement;

    registerEmail.value = 'new@example.com';
    registerUsername.value = 'new-user';
    registerPassword.value = 'password123';
    registerForm.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await flushPromises();
    await flushPromises();

    const registerMessage = registerForm.form.querySelector('p[data-status]');
    expect(registerMessage?.textContent).toContain('Registered via vanilla demo');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/login$/),
      expect.objectContaining({ method: 'POST' })
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/register$/),
      expect.objectContaining({ method: 'POST' })
    );

    document.body.removeChild(root);
  });
});
