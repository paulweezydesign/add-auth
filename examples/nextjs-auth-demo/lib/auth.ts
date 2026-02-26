const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserInfo {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  status: string;
  email_verified: boolean;
  last_login?: string;
}

export interface AuthResponse {
  message: string;
  user: UserInfo;
  session: { id: string; expires_at: string; trust_score: number };
  tokens: TokenResponse;
}

let csrfToken: string | null = null;

export const fetchCSRFToken = async (): Promise<string> => {
  const res = await fetch(`${API_BASE}/api/auth/csrf-token`, {
    credentials: 'include',
  });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken!;
};

const headers = (accessToken?: string | null, includeCsrf = false): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
  if (includeCsrf && csrfToken) h['X-CSRF-Token'] = csrfToken;
  return h;
};

export const registerUser = async (
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> => {
  await fetchCSRFToken();
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: headers(null, true),
    credentials: 'include',
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Registration failed');
  return data;
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  await fetchCSRFToken();
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: headers(null, true),
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
  return data;
};

export const getMe = async (accessToken: string): Promise<{ user: UserInfo }> => {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: headers(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
};

export const logoutUser = async (accessToken: string): Promise<void> => {
  await fetchCSRFToken();
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: headers(accessToken, true),
    credentials: 'include',
  });
};

export const healthCheck = async (): Promise<{ status: string; database: string; redis: string }> => {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
};
