export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface PasswordResetPayload {
  email?: string;
  token?: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse<T = Record<string, unknown>> {
  message?: string;
  token?: string;
  user?: Record<string, unknown> | null;
  data?: T;
  [key: string]: unknown;
}

export interface AuthClientOptions {
  /**
   * Base URL for the authentication API. Defaults to the current origin.
   */
  baseUrl?: string;
  /**
   * Custom fetch implementation (useful for testing environments).
   */
  fetchImpl?: typeof fetch;
  /**
   * Additional headers to include with every request.
   */
  defaultHeaders?: Record<string, string>;
}

export interface AuthClientInterface {
  login(credentials: AuthCredentials): Promise<AuthResponse>;
  register(credentials: AuthCredentials): Promise<AuthResponse>;
  requestPasswordReset(payload: { email: string }): Promise<AuthResponse>;
  resetPassword(payload: PasswordResetPayload): Promise<AuthResponse>;
  logout(): Promise<void>;
  getProfile<T = Record<string, unknown>>(): Promise<AuthResponse<T>>;
}

export class AuthClientError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'AuthClientError';
    this.status = status;
    this.details = details;
  }
}

const normalizeBaseUrl = (baseUrl?: string): string => {
  if (!baseUrl) {
    return '';
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

export class AuthClient implements AuthClientInterface {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: AuthClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.fetchImpl = options.fetchImpl || globalThis.fetch;

    if (!this.fetchImpl) {
      throw new Error('fetch is not available in the current environment. Provide a custom fetch implementation.');
    }

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.defaultHeaders,
    };
  }

  public async login(credentials: AuthCredentials): Promise<AuthResponse> {
    return this.request('/api/auth/login', 'POST', credentials);
  }

  public async register(credentials: AuthCredentials): Promise<AuthResponse> {
    return this.request('/api/auth/register', 'POST', credentials);
  }

  public async requestPasswordReset(payload: { email: string }): Promise<AuthResponse> {
    return this.request('/api/password-reset/request', 'POST', payload);
  }

  public async resetPassword(payload: PasswordResetPayload): Promise<AuthResponse> {
    return this.request('/api/password-reset/confirm', 'POST', payload);
  }

  public async logout(): Promise<void> {
    await this.request('/api/auth/logout', 'POST');
  }

  public async getProfile<T = Record<string, unknown>>(): Promise<AuthResponse<T>> {
    return this.request<T>('/api/auth/me', 'GET');
  }

  private async request<T = Record<string, unknown>>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<AuthResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchImpl(url, {
      method,
      headers: this.defaultHeaders,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let payload: AuthResponse<T> | undefined;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        throw new AuthClientError('Failed to parse server response', response.status, error);
      }
    }

    if (!response.ok) {
      const message = payload?.message || response.statusText || 'Request failed';
      throw new AuthClientError(message, response.status, payload);
    }

    return payload || {};
  }
}
