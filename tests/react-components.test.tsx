import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthForm } from '../src/components/react/AuthForm';
import { AuthStatus } from '../src/components/react/AuthStatus';
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

describe('React components', () => {
  it('submits login credentials and renders success message', async () => {
    const login: AuthClientInterface['login'] = jest.fn(async () => ({
      message: 'Welcome back!',
      user: { email: 'user@example.com' },
    }));
    const client = createClient({ login });

    render(<AuthForm client={client} allowModeSwitch={false} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'supersecret' },
    });

    fireEvent.click(screen.getByTestId('auth-submit'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'supersecret',
      });
    });

    expect(await screen.findByText('Welcome back!')).toBeInTheDocument();
  });

  it('toggles to registration mode and calls register', async () => {
    const register: AuthClientInterface['register'] = jest.fn(async () => ({
      message: 'Account created',
      user: { email: 'new@example.com' },
    }));
    const client = createClient({ register });

    render(<AuthForm client={client} />);

    fireEvent.click(screen.getByTestId('auth-toggle'));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'registerpass' },
    });

    fireEvent.click(screen.getByTestId('auth-submit'));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'registerpass',
        name: 'New User',
      });
    });

    expect(await screen.findByText('Account created')).toBeInTheDocument();
  });

  it('renders authentication status from client', async () => {
    const getProfile: AuthClientInterface['getProfile'] = jest.fn(async () => ({
      user: { email: 'status@example.com' },
    }));
    const client = createClient({ getProfile });

    render(<AuthStatus client={client} />);

    expect(await screen.findByText('Signed in as status@example.com')).toBeInTheDocument();
    expect(getProfile).toHaveBeenCalled();
  });

  it('renders error state when profile fetch fails', async () => {
    const getProfile: AuthClientInterface['getProfile'] = jest.fn(async () => {
      throw new Error('Network error');
    });
    const client = createClient({ getProfile });

    render(<AuthStatus client={client} />);

    expect(await screen.findByTestId('auth-status-error')).toHaveTextContent('Network error');
  });
});
