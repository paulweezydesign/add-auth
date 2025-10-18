import { AuthClient } from 'add-auth';
import {
  createLoginForm,
  createRegistrationForm,
  createPasswordResetRequestForm,
  createPasswordResetForm,
  createLogoutButton
} from 'add-auth/vanilla';

const baseUrl = (import.meta as { env: { VITE_AUTH_BASE_URL?: string } }).env.VITE_AUTH_BASE_URL ??
  'http://localhost:4000';

const client = new AuthClient({ baseUrl });

const formsContainer = document.getElementById('forms');
const profileContainer = document.getElementById('profile');

if (!formsContainer || !profileContainer) {
  throw new Error('Demo containers were not found in the DOM.');
}

const createCard = (title: string): HTMLDivElement => {
  const card = document.createElement('section');
  card.className = 'card';

  const heading = document.createElement('h2');
  heading.textContent = title;
  card.appendChild(heading);

  return card;
};

const renderProfile = async () => {
  profileContainer.innerHTML = '';
  profileContainer.className = 'profile-card';

  const heading = document.createElement('h2');
  heading.textContent = 'Session state';
  profileContainer.appendChild(heading);

  const status = document.createElement('p');
  status.textContent = 'Loading…';
  profileContainer.appendChild(status);

  try {
    const response = await client.getProfile();
    const user = response?.user ?? response?.data ?? null;

    status.textContent = user ? 'Authenticated' : 'Unauthenticated';

    if (user) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(user, null, 2);
      profileContainer.appendChild(pre);
    }
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Unable to fetch profile';
  }

  const logout = createLogoutButton({
    client,
    onSuccess: () => {
      renderProfile().catch(() => {
        /* ignored */
      });
    },
  });

  profileContainer.appendChild(logout.element);
};

const loginCard = createCard('Login');
const loginForm = createLoginForm({
  client,
  onSuccess: () => {
    renderProfile().catch(() => {
      /* ignored */
    });
  },
});
loginCard.appendChild(loginForm.element);
formsContainer.appendChild(loginCard);

const registerCard = createCard('Create account');
const registerForm = createRegistrationForm({ client });
registerCard.appendChild(registerForm.element);
formsContainer.appendChild(registerCard);

const requestResetCard = createCard('Request password reset');
const requestResetForm = createPasswordResetRequestForm({
  client,
  description: 'Enter your email address to receive a password reset token.',
});
requestResetCard.appendChild(requestResetForm.element);
formsContainer.appendChild(requestResetCard);

const resetCard = createCard('Reset password');
const resetForm = createPasswordResetForm({ client });
resetCard.appendChild(resetForm.element);
formsContainer.appendChild(resetCard);

renderProfile().catch(() => {
  /* ignored */
});
