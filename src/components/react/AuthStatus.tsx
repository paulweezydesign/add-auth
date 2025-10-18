import React, { useEffect, useMemo, useState } from 'react';
import type { AuthClientInterface, AuthResponse } from '../../frontend/authClient';

export interface AuthStatusProps {
  client: AuthClientInterface;
  pollIntervalMs?: number;
  formatter?: (response: AuthResponse | null) => React.ReactNode;
}

const defaultFormatter = (response: AuthResponse | null) => {
  if (response?.user) {
    const user = response.user as Record<string, unknown>;
    const name = (user.email as string | undefined) || (user.name as string | undefined) || 'Authenticated user';
    return `Signed in as ${name}`;
  }

  return 'You are not signed in yet.';
};

export const AuthStatus: React.FC<AuthStatusProps> = ({
  client,
  pollIntervalMs,
  formatter,
}) => {
  const [profile, setProfile] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;
    const timerApi: Pick<typeof globalThis, 'setInterval' | 'clearInterval'> =
      typeof window !== 'undefined' ? window : globalThis;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await client.getProfile();
        if (!isMounted) {
          return;
        }
        setProfile(response);
        setError(null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setProfile(null);
        setError(err instanceof Error ? err.message : 'Unable to fetch authentication status');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    if (pollIntervalMs && pollIntervalMs > 0 && typeof timerApi.setInterval === 'function') {
      intervalId = timerApi.setInterval(fetchProfile, pollIntervalMs) as unknown as number;
    }

    return () => {
      isMounted = false;
      if (intervalId && typeof timerApi.clearInterval === 'function') {
        timerApi.clearInterval(intervalId);
      }
    };
  }, [client, pollIntervalMs]);

  const renderContent = useMemo(() => {
    if (loading) {
      return <span data-testid="auth-status-loading">Checking authentication…</span>;
    }

    if (error) {
      return (
        <span className="add-auth-status-error" role="alert" data-testid="auth-status-error">
          {error}
        </span>
      );
    }

    const content = (formatter ?? defaultFormatter)(profile);

    if (typeof content === 'string') {
      return <span data-testid="auth-status-text">{content}</span>;
    }

    return <>{content}</>;
  }, [error, formatter, loading, profile]);

  return (
    <div className="add-auth-status" aria-live="polite">
      {renderContent}
    </div>
  );
};

AuthStatus.displayName = 'AuthStatus';
