import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TOKEN_KEY = 'skillbridge_token';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  /**
   * Hydrate user session from stored JWT token on mount.
   */
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response && response.user) {
        setUser(response.user);
        setToken(storedToken);
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Log in user with email & password.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.token) {
        localStorage.setItem(TOKEN_KEY, response.token);
        setToken(response.token);
        setUser(response.user);
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new student or recruiter.
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      if (response.success && response.token) {
        localStorage.setItem(TOKEN_KEY, response.token);
        setToken(response.token);
        setUser(response.user);
        return response;
      }
      throw new Error(response.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out user and purge client session.
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Non-blocking: stateless token discard proceeds regardless
      console.warn('Logout notification error:', err.message);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  /**
   * Refresh current user profile data.
   */
  const refreshUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
