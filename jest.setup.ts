import '@testing-library/jest-dom';
import 'whatwg-fetch';

if (typeof window !== 'undefined' && typeof window.fetch === 'function' && !global.fetch) {
  // Align global fetch with the window implementation for Node-based tests
  (global as unknown as { fetch?: typeof fetch }).fetch = window.fetch.bind(window);
}
