// ============================================
// FILE: frontend/src/index.js
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  </React.StrictMode>
);

// ============================================
// FILE: frontend/src/App.jsx
// ============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginButton from './components/Auth/LoginButton';
import AuthCallback from './components/Auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard/*" 
          element={
            user ? <Dashboard /> : <Navigate to="/login" replace />
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={user ? "/dashboard" : "/login"} replace />
          } 
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Login Page Component
function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-youtube-red rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            YouTube Companion Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your YouTube videos, comments, and notes in one place
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sign in to get started
              </h3>
              <LoginButton />
            </div>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Features</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-500 text-white">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Video Management</h4>
                    <p className="text-sm text-gray-500">View and edit your video details</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-500 text-white">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Comment Management</h4>
                    <p className="text-sm text-gray-500">Manage comments and replies</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-500 text-white">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Notes & Organization</h4>
                    <p className="text-sm text-gray-500">Take notes and organize your content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

// ============================================
// FILE: frontend/src/services/api.js
// ============================================

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth endpoints
  auth: {
    getAuthUrl: () => api.get('/auth'),
    getCurrentUser: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
    updateSettings: (settings) => api.put('/auth/settings', settings),
  },

  // Video endpoints
  videos: {
    getDetails: (videoId) => api.get(`/videos/${videoId}`),
    updateDetails: (videoId, data) => api.put(`/videos/${videoId}`, data),
    getUserVideos: (params) => api.get('/videos/my-videos', { params }),
    getAnalytics: (videoId) => api.get(`/videos/${videoId}/analytics`),
  },

  // Comment endpoints
  comments: {
    getVideoComments: (videoId, params) => api.get(`/comments/video/${videoId}`, { params }),
    addComment: (data) => api.post('/comments', data),
    replyToComment: (commentId, data) => api.post(`/comments/${commentId}/reply`, data),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
    getStats: (videoId) => api.get(`/comments/video/${videoId}/stats`),
  },

  // Notes endpoints
  notes: {
    getAll: (params) => api.get('/notes', { params }),
    getById: (noteId) => api.get(`/notes/${noteId}`),
    create: (data) => api.post('/notes', data),
    update: (noteId, data) => api.put(`/notes/${noteId}`, data),
    delete: (noteId, permanent = false) => api.delete(`/notes/${noteId}`, { params: { permanent } }),
    getByVideo: (videoId, params) => api.get(`/notes/video/${videoId}`, { params }),
    search: (params) => api.get('/notes/search', { params }),
    getStats: () => api.get('/notes/stats'),
    getTags: () => api.get('/notes/tags'),
    bulkOperation: (data) => api.post('/notes/bulk', data),
  },

  // Logs endpoints
  logs: {
    getUserLogs: (params) => api.get('/logs', { params }),
    getStats: (params) => api.get('/logs/stats', { params }),
    getErrors: (params) => api.get('/logs/errors', { params }),
    getByEventType: (eventType, params) => api.get(`/logs/type/${eventType}`, { params }),
    exportLogs: (params) => api.get('/logs/export', { params }),
    clearOldLogs: (data) => api.post('/logs/clear', data),
  },
};

export default api;

// ============================================
// FILE: frontend/src/services/auth.js
// ============================================

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

// ============================================
// FILE: frontend/src/services/youtube.js
// ============================================

import { apiService } from './api';

export class YouTubeService {
  static async getVideoDetails(videoId) {
    try {
      const response = await apiService.videos.getDetails(videoId);
      return response.data;
    } catch (error) {
      console.error('Error fetching video details:', error);
      throw error;
    }
  }

  static async updateVideoDetails(videoId, data) {
    try {
      const response = await apiService.videos.updateDetails(videoId, data);
      return response.data;
    } catch (error) {
      console.error('Error updating video details:', error);
      throw error;
    }
  }

  static async getUserVideos(params = {}) {
    try {
      const response = await apiService.videos.getUserVideos(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  }

  static async getVideoComments(videoId, params = {}) {
    try {
      const response = await apiService.comments.getVideoComments(videoId, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching video comments:', error);
      throw error;
    }
  }

  static async addComment(videoId, text) {
    try {
      const response = await apiService.comments.addComment({ videoId, text });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async replyToComment(commentId, text) {
    try {
      const response = await apiService.comments.replyToComment(commentId, { text });
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }

  static async deleteComment(commentId) {
    try {
      const response = await apiService.comments.deleteComment(commentId);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  static extractVideoId(url) {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  static isValidVideoId(videoId) {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  static formatDuration(duration) {
    // Convert YouTube duration format (PT4M13S) to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  static formatViewCount(count) {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  static formatPublishedDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else {
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  }
}

// ============================================
// FILE: frontend/src/utils/constants.js
// ============================================

export const API_ENDPOINTS = {
  AUTH: '/auth',
  VIDEOS: '/videos',
  COMMENTS: '/comments',
  NOTES: '/notes',
  LOGS: '/logs',
};

export const NOTE_CATEGORIES = [
  { value: 'general', label: 'General', color: 'gray' },
  { value: 'idea', label: 'Idea', color: 'yellow' },
  { value: 'todo', label: 'To Do', color: 'blue' },
  { value: 'research', label: 'Research', color: 'purple' },
  { value: 'feedback', label: 'Feedback', color: 'green' },
  { value: 'bug', label: 'Bug', color: 'red' },
  { value: 'feature', label: 'Feature', color: 'indigo' },
];

export const NOTE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
];

export const NOTE_STATUSES = [
  { value: 'active', label: 'Active', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'gray' },
];

export const NOTE_COLORS = [
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300' },
  { value: 'green', label: 'Green', bg: 'bg-green-100', border: 'border-green-300' },
  { value: 'red', label: 'Red', bg: 'bg-red-100', border: 'border-red-300' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-100', border: 'border-orange-300' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-100', border: 'border-pink-300' },
];

export const LOG_SEVERITIES = [
  { value: 'info', label: 'Info', color: 'blue' },
  { value: 'warning', label: 'Warning', color: 'yellow' },
  { value: 'error', label: 'Error', color: 'red' },
  { value: 'critical', label: 'Critical', color: 'red' },
];

export const VIDEO_PRIVACY_STATUS = {
  'public': { label: 'Public', color: 'green' },
  'unlisted': { label: 'Unlisted', color: 'yellow' },
  'private': { label: 'Private', color: 'red' },
  'deleted': { label: 'Deleted', color: 'gray' },
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const YOUTUBE_VIDEO_URL_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
export const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;