import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const result = await authService.getCurrentUser();
          if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);
          } else {
            authService.logout();
          }
        } catch (error) {
          console.error('Auth check error:', error);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await authService.login({ email, password });
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error, message: result.message };
  }, []);

  const register = useCallback(async ({ email, password, username }) => {
    const result = await authService.register({ email, password, username });
    if (result.success) {
      setUser(result.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error, message: result.message };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
