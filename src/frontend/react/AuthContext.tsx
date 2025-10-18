import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode
} from 'react';
import {
  AuthClient,
  AuthClientError,
  type AuthResponse,
  type AuthUser,
  type LoginCredentials,
  type RegistrationPayload,
  type PasswordResetPayload,
  type PasswordResetRequestPayload,
  type PasswordResetRequestResult,
  type LogoutResult
} from '../shared';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthContextValue {
  client: AuthClient;
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (payload: RegistrationPayload) => Promise<AuthResponse>;
  logout: () => Promise<LogoutResult>;
  refreshProfile: () => Promise<AuthUser | null>;
  requestPasswordReset: (
    payload: PasswordResetRequestPayload
  ) => Promise<PasswordResetRequestResult>;
  resetPassword: (payload: PasswordResetPayload) => Promise<AuthResponse>;
}

export interface AuthProviderProps {
  baseUrl?: string;
  client?: AuthClient;
  autoFetchProfile?: boolean;
  children: ReactNode;
  onError?: (error: AuthClientError) => void;
  onAuthenticated?: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({
  baseUrl,
  client: clientProp,
  autoFetchProfile = true,
  children,
  onError,
  onAuthenticated,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const client = useMemo(() => {
    if (clientProp) {
      return clientProp;
    }

    const resolvedBaseUrl =
      baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : undefined);

    if (!resolvedBaseUrl) {
      throw new Error('AuthProvider requires a baseUrl when no client instance is supplied.');
    }

    return new AuthClient({ baseUrl: resolvedBaseUrl });
  }, [baseUrl, clientProp]);

  useEffect(() => {
    if (!autoFetchProfile) {
      return;
    }

    let isMounted = true;
    setStatus('loading');

    client
      .getProfile()
      .then((response) => {
        if (!isMounted) return;
        const nextUser = (response?.user ?? (response?.data as AuthUser | null)) ?? null;
        setUser(nextUser);
        setStatus(nextUser ? 'authenticated' : 'idle');
        setError(null);
        onAuthenticated?.(nextUser);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Unable to fetch profile';
        setError(message);
        setStatus('error');
        if (err instanceof AuthClientError) {
          onError?.(err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [autoFetchProfile, client, onAuthenticated, onError]);

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Authentication request failed';
    setError(message);
    setStatus('error');
    if (err instanceof AuthClientError) {
      onError?.(err);
    }
  }, [onError]);

  const value = useMemo<AuthContextValue>(() => ({
    client,
    user,
    status,
    error,
    async login(credentials) {
      setStatus('loading');
      try {
        const result = await client.login(credentials);
        const nextUser = (result?.user ?? (result?.data as AuthUser | null)) ?? null;
        setUser(nextUser);
        setStatus(nextUser ? 'authenticated' : 'idle');
        setError(null);
        onAuthenticated?.(nextUser);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    async register(payload) {
      setStatus('loading');
      try {
        const result = await client.register(payload);
        const nextUser = (result?.user ?? (result?.data as AuthUser | null)) ?? null;
        setUser(nextUser);
        setStatus(nextUser ? 'authenticated' : 'idle');
        setError(null);
        onAuthenticated?.(nextUser);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    async logout() {
      setStatus('loading');
      try {
        const result = await client.logout();
        setUser(null);
        setStatus('idle');
        setError(null);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    async refreshProfile() {
      setStatus('loading');
      try {
        const response = await client.getProfile();
        const nextUser = (response?.user ?? (response?.data as AuthUser | null)) ?? null;
        setUser(nextUser);
        setStatus(nextUser ? 'authenticated' : 'idle');
        setError(null);
        return nextUser;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    async requestPasswordReset(payload) {
      setStatus('loading');
      try {
        const result = await client.requestPasswordReset(payload);
        setStatus('idle');
        setError(null);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    async resetPassword(payload) {
      setStatus('loading');
      try {
        const result = await client.resetPassword(payload);
        setStatus('idle');
        setError(null);
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
  }), [client, error, handleError, onAuthenticated, onError, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
