import { showNotification } from '../utils/notifications.js';

/**
 * Register page component
 */
export class RegisterPage {
  constructor(authService, router) {
    this.authService = authService;
    this.router = router;
  }

  /**
   * Render registration form
   */
  render() {
    const main = document.getElementById('main');
    main.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Register</h2>
          <form id="registerForm">
            <div class="form-group">
              <label for="username">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                required 
                autocomplete="username"
              />
            </div>
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
                autocomplete="new-password"
                minlength="8"
              />
              <small class="form-hint">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                required 
                autocomplete="new-password"
              />
            </div>
            <button type="submit" class="btn btn-primary">Register</button>
          </form>
          <p class="auth-link">
            Already have an account? 
            <a href="/login" data-navigate>Login</a>
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
    const form = document.getElementById('registerForm');
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
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Client-side validation
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Registering...';

    try {
      const result = await this.authService.register({ username, email, password });

      if (result.success) {
        showNotification('Registration successful!', 'success');
        this.router.navigate('/dashboard');
      } else {
        showNotification(result.message || 'Registration failed', 'error');
      }
    } catch (error) {
      showNotification('An error occurred during registration', 'error');
      console.error('Registration error:', error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Register';
    }
  }
}
