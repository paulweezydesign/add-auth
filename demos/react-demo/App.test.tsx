import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DemoApp from './App';

describe('React demo', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      (global.fetch as typeof fetch | undefined) = originalFetch;
    }
  });

  it('authenticates a user and updates the status panel', async () => {
    const mockFetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      const jsonResponse = (data: unknown, init: ResponseInit = { status: 200 }) =>
        new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
          ...init
        });

      if (url.endsWith('/login')) {
        return jsonResponse({
          message: 'Logged in via React demo',
          tokens: { accessToken: 'token', refreshToken: 'refresh-token' },
          user: { id: '1', email: 'demo@example.com' }
        });
      }

      if (url.endsWith('/register')) {
        return jsonResponse({
          message: 'Registered via React demo',
          tokens: { accessToken: 'token2', refreshToken: 'refresh-token-2' },
          user: { id: '2', email: 'new@example.com' }
        });
      }

      if (url.endsWith('/me')) {
        return jsonResponse({ user: { id: '1', email: 'demo@example.com' } });
      }

      if (url.endsWith('/logout')) {
        return jsonResponse({ message: 'Logged out' });
      }

      if (url.endsWith('/refresh')) {
        return jsonResponse({
          tokens: { accessToken: 'refreshed', refreshToken: 'refresh-token' }
        });
      }

      return jsonResponse({});
    });

    jest.spyOn(global, 'fetch').mockImplementation(mockFetch as typeof fetch);

    render(<DemoApp />);

    const emailInput = screen.getByLabelText('Email', { selector: 'input#add-auth-email' });
    const passwordInput = screen.getByLabelText('Password', { selector: 'input#add-auth-password' });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'demo@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Logged in via React demo')).toBeInTheDocument();
    });

    const status = screen.getByTestId('auth-user-value');
    expect(status).toHaveTextContent('demo@example.com');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/login$/),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
