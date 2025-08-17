
import React, { createContext, useState, useEffect } from 'react';
import { AuthService } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is stored in localStorage
      const storedUser = AuthService.getUser();
      const token = AuthService.getToken();

      if (token && storedUser) {
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          AuthService.removeToken();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Failed to check authentication status');
      AuthService.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setError(null);
      await AuthService.initiateLogin();
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to initiate login');
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await AuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if logout request fails
      setUser(null);
      AuthService.removeToken();
    }
  };

  const handleAuthCallback = async (token, userData) => {
    try {
      setLoading(true);
      setError(null);

      // Store token and user data
      AuthService.setToken(token);
      AuthService.setUser(userData);
      setUser(userData);

      return true;
    } catch (error) {
      console.error('Auth callback error:', error);
      setError('Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Auth refresh error:', error);
      logout();
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    AuthService.setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    handleAuthCallback,
    refreshAuth,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
