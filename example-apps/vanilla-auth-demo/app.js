const API_BASE = 'http://localhost:3000';

// ─── State ───────────────────────────────────────────────
let accessToken = null;
let csrfToken = null;

// ─── DOM Refs ────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);

const loginView = $('#login-view');
const registerView = $('#register-view');
const dashboardView = $('#dashboard-view');
const alerts = $('#alerts');
const apiStatus = $('#api-status');

// ─── API Helpers ─────────────────────────────────────────
const fetchCSRF = async () => {
  const res = await fetch(`${API_BASE}/api/auth/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
};

const apiCall = async (path, { method = 'GET', body, auth = false, csrf = false } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (csrf) {
    await fetchCSRF();
    headers['X-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`);
  return data;
};

// ─── UI Helpers ──────────────────────────────────────────
const showView = (view) => {
  [loginView, registerView, dashboardView].forEach((v) => v.classList.add('hidden'));
  view.classList.remove('hidden');
  clearAlerts();
};

const showAlert = (msg, type = 'error') => {
  alerts.innerHTML = `<div class="alert ${type}">${msg}</div>`;
  setTimeout(() => (alerts.innerHTML = ''), 5000);
};

const clearAlerts = () => (alerts.innerHTML = '');

const renderDashboard = (user) => {
  $('#user-avatar').textContent = user.email[0].toUpperCase();
  $('#user-details').innerHTML = `
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>User ID:</strong> <code>${user.id}</code></p>
    <p><strong>Status:</strong> <span class="badge">${user.status}</span></p>
    <p><strong>Email Verified:</strong> ${user.email_verified ? '✅ Yes' : '❌ No'}</p>
    ${user.last_login ? `<p><strong>Last Login:</strong> ${new Date(user.last_login).toLocaleString()}</p>` : ''}
    ${user.created_at ? `<p><strong>Created:</strong> ${new Date(user.created_at).toLocaleString()}</p>` : ''}
  `;
};

const setLoading = (btn, loading, text) => {
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait...' : text;
};

// ─── Event Handlers ──────────────────────────────────────
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#login-btn');
  setLoading(btn, true, 'Sign In');

  try {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      csrf: true,
      body: {
        email: $('#login-email').value,
        password: $('#login-password').value,
      },
    });
    accessToken = data.tokens.accessToken;
    renderDashboard(data.user);
    showView(dashboardView);
    showAlert('Login successful!', 'success');
  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(btn, false, 'Sign In');
  }
});

$('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#register-btn');
  setLoading(btn, true, 'Create Account');

  try {
    const data = await apiCall('/api/auth/register', {
      method: 'POST',
      csrf: true,
      body: {
        username: $('#reg-username').value,
        email: $('#reg-email').value,
        password: $('#reg-password').value,
        confirmPassword: $('#reg-confirm').value,
      },
    });
    accessToken = data.tokens.accessToken;
    renderDashboard(data.user);
    showView(dashboardView);
    showAlert('Registration successful!', 'success');
  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(btn, false, 'Create Account');
  }
});

$('#logout-btn').addEventListener('click', async () => {
  try {
    await apiCall('/api/auth/logout', { method: 'POST', auth: true, csrf: true });
  } catch {
    // Ignore logout errors
  }
  accessToken = null;
  showView(loginView);
  showAlert('Logged out successfully', 'success');
});

$('#refresh-btn').addEventListener('click', async () => {
  try {
    const data = await apiCall('/api/auth/me', { auth: true });
    renderDashboard(data.user);
    showAlert('User info refreshed', 'success');
  } catch {
    showAlert('Session expired. Please log in again.');
    accessToken = null;
    showView(loginView);
  }
});

$('#show-register').addEventListener('click', (e) => { e.preventDefault(); showView(registerView); });
$('#show-login').addEventListener('click', (e) => { e.preventDefault(); showView(loginView); });

// ─── Health Check ────────────────────────────────────────
fetch(`${API_BASE}/health`)
  .then((r) => r.json())
  .then(() => {
    apiStatus.textContent = 'API: online';
    apiStatus.className = 'status online';
  })
  .catch(() => {
    apiStatus.textContent = 'API: offline';
    apiStatus.className = 'status offline';
  });
