import { useState, useEffect } from 'react';
import { register, login, getMe, logout, healthCheck } from './api/auth';
import './App.css';

type View = 'login' | 'register' | 'dashboard';

interface User {
  id: string;
  email: string;
  status: string;
  email_verified: boolean;
  last_login?: string;
  created_at?: string;
}

const App = () => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = form.get('username') as string;
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const confirmPassword = form.get('confirmPassword') as string;

    try {
      const data = await register(username, email, password, confirmPassword);
      setAccessToken(data.tokens.accessToken);
      setUser(data.user as User);
      setSuccess('Registration successful!');
      setView('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      const data = await login(email, password);
      setAccessToken(data.tokens.accessToken);
      setUser(data.user as User);
      setSuccess('Login successful!');
      setView('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await logout(accessToken);
      } catch {
        // Ignore logout errors
      }
    }
    setUser(null);
    setAccessToken(null);
    setView('login');
    setSuccess('Logged out successfully');
  };

  const refreshUserInfo = async () => {
    if (!accessToken) return;
    try {
      const data = await getMe(accessToken);
      setUser(data.user as User);
    } catch {
      setError('Session expired. Please log in again.');
      handleLogout();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔐 Add-Auth React Demo</h1>
        <div className={`status ${apiStatus}`}>
          API: {apiStatus === 'checking' ? '...' : apiStatus}
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {view === 'login' && (
        <div className="card">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" name="password" type="password" required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="switch">
            Don't have an account?{' '}
            <a href="#" onClick={() => { setView('register'); setError(''); setSuccess(''); }}>Register</a>
          </p>
        </div>
      )}

      {view === 'register' && (
        <div className="card">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="reg-username">Username</label>
              <input id="reg-username" name="username" required minLength={3} maxLength={30} placeholder="johndoe" />
            </div>
            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" name="password" type="password" required minLength={8} placeholder="Min 8 chars, A-z, 0-9, !@#$" />
            </div>
            <div className="field">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" name="confirmPassword" type="password" required placeholder="Repeat password" />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="switch">
            Already have an account?{' '}
            <a href="#" onClick={() => { setView('login'); setError(''); setSuccess(''); }}>Login</a>
          </p>
        </div>
      )}

      {view === 'dashboard' && user && (
        <div className="card dashboard">
          <h2>Dashboard</h2>
          <div className="user-info">
            <div className="avatar">{user.email[0].toUpperCase()}</div>
            <div className="details">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> <code>{user.id}</code></p>
              <p><strong>Status:</strong> <span className="badge">{user.status}</span></p>
              <p><strong>Email Verified:</strong> {user.email_verified ? '✅ Yes' : '❌ No'}</p>
              {user.last_login && (
                <p><strong>Last Login:</strong> {new Date(user.last_login).toLocaleString()}</p>
              )}
              {user.created_at && (
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="actions">
            <button onClick={refreshUserInfo} className="secondary">Refresh Info</button>
            <button onClick={handleLogout} className="danger">Logout</button>
          </div>
        </div>
      )}

      <footer>
        <p>
          Powered by <strong>@paulweezydesign/add-auth</strong> — React + Vite + TypeScript
        </p>
      </footer>
    </div>
  );
};

export default App;
