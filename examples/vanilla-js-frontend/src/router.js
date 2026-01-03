/**
 * Simple client-side router using modern JavaScript
 */
export class Router {
  constructor() {
    this.routes = new Map();
  }

  /**
   * Add a route handler
   */
  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  /**
   * Navigate to a route
   */
  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  /**
   * Handle current route
   */
  handleRoute() {
    const path = window.location.pathname;
    const handler = this.routes.get(path) || this.routes.get('/');

    if (handler) {
      handler();
    } else {
      this.routes.get('/')?.();
    }
  }
}
