import {
  type AuthResponse,
  type AuthUser,
  type AuthClientOptions,
  type AuthClientRequestOptions,
  type LoginCredentials,
  type RegistrationPayload,
  type PasswordResetPayload,
  type PasswordResetRequestPayload,
  type PasswordResetRequestResult,
  type LogoutResult,
  type CsrfTokenResponse
} from './types';

const DEFAULT_CSRF_ENDPOINT = '/api/auth/csrf-token';

export class AuthClientError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'AuthClientError';
    this.status = status;
    this.details = details;
  }
}

export class AuthClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;
  private readonly credentials: RequestCredentials;
  private csrfToken?: string;
  private readonly csrfEndpoint: string;

  constructor(options: AuthClientOptions) {
    if (!options.baseUrl) {
      throw new Error('AuthClient requires a baseUrl option');
    }

    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetch ?? fetch;
    this.defaultHeaders = options.defaultHeaders ?? { 'Content-Type': 'application/json' };
    this.credentials = options.credentials ?? 'include';
    this.csrfEndpoint = options.csrfEndpoint ?? DEFAULT_CSRF_ENDPOINT;
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (!path.startsWith('/')) {
      return `${this.baseUrl}/${path}`;
    }

    return `${this.baseUrl}${path}`;
  }

  private async ensureCsrfToken(force = false): Promise<string> {
    if (!force && this.csrfToken) {
      return this.csrfToken;
    }

    const response = await this.fetchImpl(this.buildUrl(this.csrfEndpoint), {
      method: 'GET',
      credentials: this.credentials,
      headers: {
        Accept: 'application/json',
        ...this.defaultHeaders,
      },
    });

    if (!response.ok) {
      throw new AuthClientError('Failed to retrieve CSRF token', response.status);
    }

    const data = (await response.json()) as CsrfTokenResponse;
    if (!data?.csrfToken) {
      throw new AuthClientError('Server did not provide a CSRF token');
    }

    this.csrfToken = data.csrfToken;
    return this.csrfToken;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    options: AuthClientRequestOptions = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(init.headers as Record<string, string> | undefined),
      ...(options.headers ?? {}),
    };

    if (options.csrf) {
      const token = await this.ensureCsrfToken();
      headers['X-CSRF-Token'] = token;
    }

    const response = await this.fetchImpl(this.buildUrl(path), {
      credentials: this.credentials,
      ...init,
      headers,
    });

    const newCsrfToken = response.headers.get('x-csrf-token');
    if (newCsrfToken) {
      this.csrfToken = newCsrfToken;
    }

    if (!response.ok) {
      let details: unknown;
      try {
        details = await response.json();
      } catch (error) {
        details = undefined;
      }

      const message =
        typeof details === 'object' && details && 'error' in details
          ? String((details as Record<string, unknown>).error)
          : response.statusText || 'Request failed';

      throw new AuthClientError(message, response.status, details);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const body = JSON.stringify(credentials);
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body,
    });
  }

  async register(payload: RegistrationPayload): Promise<AuthResponse> {
    const body = JSON.stringify(payload);
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body,
    });
  }

  async logout(): Promise<LogoutResult> {
    return this.request<LogoutResult>(
      '/api/auth/logout',
      {
        method: 'POST',
      },
      { csrf: true }
    );
  }

  async getProfile(): Promise<AuthResponse<AuthUser>> {
    return this.request<AuthResponse<AuthUser>>('/api/auth/me');
  }

  async refresh(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async requestPasswordReset(
    payload: PasswordResetRequestPayload
  ): Promise<PasswordResetRequestResult> {
    return this.request<PasswordResetRequestResult>(
      '/api/password-reset/request',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true }
    );
  }

  async verifyPasswordResetToken(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>(`/api/password-reset/verify/${encodeURIComponent(token)}`);
  }

  async resetPassword(payload: PasswordResetPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>(
      '/api/password-reset/reset',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true }
    );
  }

  clearCsrfToken(): void {
    this.csrfToken = undefined;
  }
}

export default AuthClient;
