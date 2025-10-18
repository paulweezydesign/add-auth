export interface AuthUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface AuthResponse<T = unknown> {
  success?: boolean;
  message?: string;
  user?: AuthUser | null;
  token?: string;
  data?: T;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegistrationPayload {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
  [key: string]: unknown;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetPayload {
  email: string;
  token: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  csrfEndpoint?: string;
  defaultHeaders?: Record<string, string>;
  credentials?: RequestCredentials;
}

export interface AuthClientRequestOptions {
  csrf?: boolean;
  headers?: Record<string, string>;
}

export interface PasswordResetRequestResult {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export type LogoutResult = {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
};

export interface CsrfTokenResponse {
  success?: boolean;
  csrfToken?: string;
  [key: string]: unknown;
}
