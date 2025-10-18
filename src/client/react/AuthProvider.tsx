import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { createAuthClient } from '../shared/createAuthClient';
import {
  AuthClient,
  AuthClientOptions,
  AuthResponse,
  AuthStatus,
  AuthTokens,
  AuthUser,
  LoginCredentials,
  RegistrationPayload
} from '../shared/types';

export interface AuthContextValue {
  client: AuthClient;
  status: AuthStatus;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  error?: string;
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(payload: RegistrationPayload): Promise<AuthResponse>;
  logout(): Promise<void>;
  refresh(): Promise<AuthTokens>;
  clearError(): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps extends AuthClientOptions {
  children: React.ReactNode;
  client?: AuthClient;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  client: providedClient,
  ...options
}) => {
  const client = useMemo(
    () => providedClient ?? createAuthClient(options),
    [providedClient, options.baseUrl, options.fetcher, options.storage, options.storageKeyPrefix]
  );

  const [status, setStatus] = useState<AuthStatus>(() =>
    client.getTokens() ? 'authenticated' : 'idle'
  );
  const [error, setError] = useState<string | undefined>();
  const [user, setUser] = useState<AuthUser | null>(() => client.getUser());
  const [tokens, setTokens] = useState<AuthTokens | null>(() => client.getTokens());

  const syncState = useCallback(() => {
    setTokens(client.getTokens());
    setUser(client.getUser());
    setStatus(client.getTokens() ? 'authenticated' : 'idle');
  }, [client]);

  useEffect(() => {
    syncState();
  }, [client, syncState]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setStatus('loading');
      setError(undefined);
      try {
        const response = await client.login(credentials);
        syncState();
        setStatus('authenticated');
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        setStatus('error');
        throw err;
      }
    },
    [client, syncState]
  );

  const register = useCallback(
    async (payload: RegistrationPayload) => {
      setStatus('loading');
      setError(undefined);
      try {
        const response = await client.register(payload);
        syncState();
        setStatus('authenticated');
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setError(message);
        setStatus('error');
        throw err;
      }
    },
    [client, syncState]
  );

  const logout = useCallback(async () => {
    setStatus('loading');
    setError(undefined);
    try {
      await client.logout();
      syncState();
    } finally {
      setStatus('idle');
    }
  }, [client, syncState]);

  const refresh = useCallback(async () => {
    setError(undefined);
    const refreshed = await client.refresh();
    syncState();
    setStatus('authenticated');
    return refreshed;
  }, [client, syncState]);

  const clearError = useCallback(() => setError(undefined), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      status,
      user,
      tokens,
      error,
      login,
      register,
      logout,
      refresh,
      clearError
    }),
    [client, status, user, tokens, error, login, register, logout, refresh, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
