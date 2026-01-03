import { showNotification } from '../utils/notifications.js';

/**
 * Dashboard page component
 */
export class DashboardPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
    this.user = null;
  }

  /**
   * Render dashboard
   */
  async render() {
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-card">
          <h2>Dashboard</h2>
          <div id="userInfo" class="user-info">
            <p>Loading...</p>
          </div>
          <button id="logoutBtn" class="btn btn-secondary">Logout</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    await this.loadUserInfo();
  }

  /**
   * Load user information
   */
  async loadUserInfo() {
    const userInfoEl = document.getElementById('userInfo');

    try {
      const result = await this.authService.getCurrentUser();

      if (result.success) {
        this.user = result.user;
        userInfoEl.innerHTML = `
          <div class="user-details">
            <p><strong>ID:</strong> ${this.user.id}</p>
            <p><strong>Email:</strong> ${this.user.email}</p>
            <p><strong>Username:</strong> ${this.user.username}</p>
            <p><strong>Created:</strong> ${new Date(this.user.createdAt).toLocaleString()}</p>
          </div>
        `;
      } else {
        userInfoEl.innerHTML = `<p class="error">Failed to load user info: ${result.message}</p>`;
      }
    } catch (error) {
      userInfoEl.innerHTML = `<p class="error">Error loading user info</p>`;
      console.error('Error loading user:', error);
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', this.handleLogout.bind(this));
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    await this.authService.logout();
    showNotification('Logged out successfully', 'success');
    this.router.navigate('/login');
  }
}
