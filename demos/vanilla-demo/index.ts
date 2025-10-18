import { renderLoginForm, renderRegisterForm } from '../../src/client/vanilla';

export function bootstrapVanillaDemo(root: HTMLElement) {
  const loginContainer = document.createElement('div');
  loginContainer.id = 'vanilla-login';
  const registerContainer = document.createElement('div');
  registerContainer.id = 'vanilla-register';

  root.append(loginContainer, registerContainer);

  const loginForm = renderLoginForm({
    container: loginContainer,
    baseUrl: 'https://demo.add-auth.test/api/auth'
  });

  const registerForm = renderRegisterForm({
    container: registerContainer,
    baseUrl: 'https://demo.add-auth.test/api/auth'
  });

  return { loginForm, registerForm };
}
