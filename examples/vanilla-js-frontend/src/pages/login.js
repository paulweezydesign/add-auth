import { showNotification } from '../utils/notifications.js';

/**
 * Login page component
 */
export class LoginPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
  }

  /**
   * Render login form
   */
  render() {
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Login</h2>
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                autocomplete="email"
              />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                autocomplete="current-password"
              />
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
          </form>
          <p class="auth-link">
            Don't have an account? 
            <a href="/register" data-navigate>Register</a>
          </p>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const form = document.getElementById('loginForm');
    const navLinks = document.querySelectorAll('[data-navigate]');

    form.addEventListener('submit', this.handleSubmit.bind(this));

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.router.navigate(link.getAttribute('href'));
      });
    });
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
      const result = await this.authService.login({ email, password });

      if (result.success) {
        showNotification('Login successful!', 'success');
        this.router.navigate('/dashboard');
      } else {
        showNotification(result.message || 'Login failed', 'error');
      }
    } catch (error) {
      showNotification('An error occurred during login', 'error');
      console.error('Login error:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  }
}
