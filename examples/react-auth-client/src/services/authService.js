import { api } from './api';

export const authService = {
  login: async (email, password) => {
    return api.post('/login', { email, password });
  },

  register: async (username, email, password) => {
    return api.post('/register', { username, email, password });
  },

  getProfile: async (token) => {
    return api.get('/me', token);
  },
  
  refreshToken: async (refreshToken) => {
      return api.post('/refresh', { refreshToken });
  }
};
