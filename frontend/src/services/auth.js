

import { apiService } from './api';

export class AuthService {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  static getUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }

  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  static async initiateLogin() {
    try {
      const response = await apiService.auth.getAuthUrl();
      if (response.data.success) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error) {
      console.error('Login initiation error:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const response = await apiService.auth.getCurrentUser();
      if (response.data.success) {
        this.setUser(response.data.user);
        return response.data.user;
      }
      throw new Error('Failed to get current user');
    } catch (error) {
      console.error('Get current user error:', error);
      this.removeToken();
      throw error;
    }
  }

  static async logout() {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
      window.location.href = '/login';
    }
  }

  static async refreshToken() {
    try {
      const response = await apiService.auth.refreshToken();
      if (response.data.success) {
        this.setToken(response.data.token);
        return response.data.token;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      this.removeToken();
      throw error;
    }
  }
}
