const API_BASE = 'http://localhost:3000';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface UserInfo {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  status: string;
  email_verified: boolean;
  last_login?: string;
}

interface AuthResponse {
  message: string;
  user: UserInfo;
  session: { id: string; expires_at: string; trust_score: number };
  tokens: TokenResponse;
}

let csrfToken: string | null = null;

const fetchCSRFToken = async (): Promise<string> => {
  const res = await fetch(`${API_BASE}/api/auth/csrf-token`, {
    credentials: 'include',
  });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken!;
};

const authHeaders = (accessToken?: string | null, includeCsrf = false): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (includeCsrf && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return headers;
};

export const register = async (
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> => {
  await fetchCSRFToken();
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: authHeaders(null, true),
    credentials: 'include',
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || err.error || 'Registration failed');
  }
  return res.json();
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  await fetchCSRFToken();
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: authHeaders(null, true),
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || err.error || 'Login failed');
  }
  return res.json();
};

export const getMe = async (accessToken: string): Promise<{ user: UserInfo }> => {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
};

export const logout = async (accessToken: string): Promise<void> => {
  await fetchCSRFToken();
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: authHeaders(accessToken, true),
    credentials: 'include',
  });
};

export const healthCheck = async () => {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
};
