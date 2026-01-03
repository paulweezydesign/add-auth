const API_BASE_URL = '/api/auth';

/**
 * Authentication service using modern functional JavaScript
 */
class AuthService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken') || null;
    this.refreshToken = localStorage.getItem('refreshToken') || null;
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.refreshToken && endpoint !== '/refresh') {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    return response;
  }

  /**
   * Register a new user
   */
  async register({ email, password, username }) {
    const response = await this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });

    const data = await response.json();

    if (data.success) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      return { success: true, user: data.data.user };
    }

    return { success: false, error: data.error, message: data.message };
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      return { success: true, user: data.data.user };
    }

    return { success: false, error: data.error, message: data.message };
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.request('/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await this.request('/me');
    const data = await response.json();

    if (data.success) {
      return { success: true, user: data.data.user };
    }

    return { success: false, error: data.error, message: data.message };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      this.clearTokens();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Set authentication tokens
   */
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken;
  }
}

export const authService = new AuthService();
