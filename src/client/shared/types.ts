export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  message?: string;
  tokens?: AuthTokens;
  user?: AuthUser;
  session?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  [key: string]: unknown;
}

export interface RegistrationPayload {
  email: string;
  password: string;
  username?: string;
  [key: string]: unknown;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AuthClientOptions {
  baseUrl?: string;
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  storage?: StorageLike;
  storageKeyPrefix?: string;
}

export interface AuthClient {
  baseUrl: string;
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(payload: RegistrationPayload): Promise<AuthResponse>;
  logout(): Promise<void>;
  refresh(): Promise<AuthTokens>;
  getProfile(): Promise<AuthUser>;
  getTokens(): AuthTokens | null;
  getUser(): AuthUser | null;
  clear(): void;
}

export interface AuthError extends Error {
  status?: number;
  details?: unknown;
}
