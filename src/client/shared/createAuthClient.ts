import {
  AuthClient,
  AuthClientOptions,
  AuthError,
  AuthResponse,
  AuthTokens,
  AuthUser,
  LoginCredentials,
  RegistrationPayload,
  StorageLike
} from './types';

const DEFAULT_BASE_URL = '/api/auth';
const DEFAULT_STORAGE_PREFIX = 'add-auth';

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    }
  };
}

function resolveStorage(storage?: StorageLike): StorageLike {
  if (storage) {
    return storage;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: (key) => window.localStorage.removeItem(key)
    };
  }

  return createMemoryStorage();
}

function resolveFetcher(fetcher?: AuthClientOptions['fetcher']) {
  if (fetcher) {
    return fetcher;
  }

  if (typeof fetch !== 'undefined') {
    return fetch.bind(globalThis);
  }

  throw new Error('No fetch implementation available. Provide a custom fetcher in AuthClientOptions.');
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse stored JSON value', { value, error });
    return null;
  }
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeBaseUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return DEFAULT_BASE_URL;
  }

  if (baseUrl.endsWith('/')) {
    return baseUrl.slice(0, -1);
  }

  return baseUrl;
}

async function extractJson(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      console.warn('Failed to parse JSON response', { error });
    }
  }

  return {};
}

function createError(response: Response, data: Record<string, unknown>): AuthError {
  const message =
    (typeof data.message === 'string' && data.message) ||
    (typeof data.error === 'string' && data.error) ||
    `Request failed with status ${response.status}`;

  const error: AuthError = new Error(message);
  error.status = response.status;
  error.details = data;
  return error;
}

function mergeHeaders(defaultHeaders: Record<string, string>, custom?: HeadersInit): HeadersInit {
  const headers = new Headers(custom ?? {});

  for (const [key, value] of Object.entries(defaultHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return headers;
}

export function createAuthClient(options: AuthClientOptions = {}): AuthClient {
  const fetcher = resolveFetcher(options.fetcher);
  const storage = resolveStorage(options.storage);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const prefix = options.storageKeyPrefix ?? DEFAULT_STORAGE_PREFIX;
  const tokenKey = `${prefix}:tokens`;
  const userKey = `${prefix}:user`;

  const getTokens = () => parseJson<AuthTokens>(storage.getItem(tokenKey));
  const setTokens = (tokens: AuthTokens | null) => {
    if (tokens) {
      storage.setItem(tokenKey, serialize(tokens));
    } else {
      storage.removeItem(tokenKey);
    }
  };

  const getUser = () => parseJson<AuthUser>(storage.getItem(userKey));
  const setUser = (user: AuthUser | null) => {
    if (user) {
      storage.setItem(userKey, serialize(user));
    } else {
      storage.removeItem(userKey);
    }
  };

  const request = async (path: string, init: RequestInit = {}): Promise<AuthResponse> => {
    const url = `${baseUrl}${path}`;
    const response = await fetcher(url, {
      credentials: 'include',
      ...init,
      headers: mergeHeaders({ 'Content-Type': 'application/json' }, init.headers)
    });

    const data = await extractJson(response);

    if (!response.ok) {
      throw createError(response, data);
    }

    return data as AuthResponse;
  };

  const authorizedRequest = async (path: string, init: RequestInit = {}) => {
    const tokens = getTokens();
    const headers = new Headers(init.headers ?? {});

    if (tokens?.accessToken) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }

    return request(path, { ...init, headers });
  };

  return {
    baseUrl,
    async login(credentials: LoginCredentials) {
      const result = await request('/login', {
        method: 'POST',
        body: serialize(credentials)
      });

      if (result.tokens) {
        setTokens(result.tokens);
      }

      if (result.user) {
        setUser(result.user);
      }

      return result;
    },
    async register(payload: RegistrationPayload) {
      const result = await request('/register', {
        method: 'POST',
        body: serialize(payload)
      });

      if (result.tokens) {
        setTokens(result.tokens);
      }

      if (result.user) {
        setUser(result.user);
      }

      return result;
    },
    async logout() {
      try {
        await authorizedRequest('/logout', {
          method: 'POST'
        });
      } finally {
        setTokens(null);
        setUser(null);
      }
    },
    async refresh() {
      const tokens = getTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await request('/refresh', {
        method: 'POST',
        body: serialize({ refreshToken: tokens.refreshToken })
      });

      if (!result.tokens) {
        throw new Error('Invalid refresh response');
      }

      setTokens(result.tokens);
      return result.tokens;
    },
    async getProfile() {
      const result = await authorizedRequest('/me', {
        method: 'GET'
      });

      if (!result.user) {
        throw new Error('Profile response did not include user data');
      }

      setUser(result.user);
      return result.user;
    },
    getTokens() {
      return getTokens();
    },
    getUser() {
      return getUser();
    },
    clear() {
      setTokens(null);
      setUser(null);
    }
  };
}
