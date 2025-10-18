import { AuthClient, createAuthWidget } from '../../src';

const client = new AuthClient({ baseUrl: 'http://localhost:3000' });

document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('auth-root');

  if (!target) {
    throw new Error('Vanilla demo expected an element with id "auth-root".');
  }

  createAuthWidget({ target, client, allowModeSwitch: true });
});
