import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const saveTokens = (accessToken, newRefreshToken) => {
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
      localStorage.setItem('refreshToken', newRefreshToken);
    }
  };

  const clearTokens = useCallback(() => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, []);

  // Fetch user profile if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.getProfile(token);
        setUser(data.user);
      } catch (err) {
        // If 401/403, try to refresh
        if (err.status === 401 || err.status === 403) {
             if(refreshToken) {
                 try {
                     const refreshData = await authService.refreshToken(refreshToken);
                     saveTokens(refreshData.accessToken);
                     // Retry profile fetch
                     const retryData = await authService.getProfile(refreshData.accessToken);
                     setUser(retryData.user);
                     return;
                 } catch(refreshErr) {
                     console.error("Refresh failed", refreshErr);
                     clearTokens();
                 }
             } else {
                 clearTokens();
             }
        } else {
            console.error("Auth init error", err);
            clearTokens();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, refreshToken, clearTokens]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(username, email, password);
      // Usually register doesn't auto-login in some APIs, but if it returns tokens:
      if (data.accessToken) {
        saveTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
