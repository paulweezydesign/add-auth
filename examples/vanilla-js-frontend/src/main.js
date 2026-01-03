import { AuthService } from './services/auth.js';
import { Router } from './router.js';
import { LoginPage } from './pages/login.js';
import { RegisterPage } from './pages/register.js';
import { DashboardPage } from './pages/dashboard.js';
import { showNotification } from './utils/notifications.js';

// Initialize services
const authService = new AuthService();
const router = new Router();

// Initialize app
const initApp = () => {
  // Register routes
  router.addRoute('/', () => {
    if (authService.isAuthenticated()) {
      router.navigate('/dashboard');
    } else {
      router.navigate('/login');
    }
  });

  router.addRoute('/login', () => {
    const loginPage = new LoginPage(authService, router);
    loginPage.render();
  });

  router.addRoute('/register', () => {
    const registerPage = new RegisterPage(authService, router);
    registerPage.render();
  });

  router.addRoute('/dashboard', () => {
    if (!authService.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    const dashboardPage = new DashboardPage(authService, router);
    dashboardPage.render();
  });

  // Handle initial route
  router.handleRoute();

  // Handle browser navigation
  window.addEventListener('popstate', () => {
    router.handleRoute();
  });
};

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
