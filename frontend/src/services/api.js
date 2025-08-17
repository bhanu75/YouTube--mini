
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
