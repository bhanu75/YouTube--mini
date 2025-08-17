// ============================================
// FILE: frontend/src/context/AuthContext.jsx
// ============================================

import React, { createContext, useState, useEffect } from 'react';



import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import { useAuth } from './useAuth';

// Custom hook for API queries with authentication
export function useAuthenticatedQuery(key, queryFn, options = {}) {
  const { isAuthenticated } = useAuth();
  
  return useQuery(
    key,
    queryFn,
    {
      enabled: isAuthenticated && (options.enabled ?? true),
      retry: (failureCount, error) => {
        // Don't retry if unauthorized
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      ...options,
    }
  );
}

// Custom hook for API mutations with optimistic updates
export function useAuthenticatedMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation(mutationFn, {
    onError: (error) => {
      console.error('Mutation error:', error);
      if (options.onError) {
        options.onError(error);
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries on success
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries(key);
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    ...options,
  });
}

// Video-related hooks
export function useVideo(videoId) {
  return useAuthenticatedQuery(
    ['video', videoId],
    () => apiService.videos.getDetails(videoId).then(res => res.data),
    {
      enabled: !!videoId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useUserVideos(params = {}) {
  return useAuthenticatedQuery(
    ['user-videos', params],
    () => apiService.videos.getUserVideos(params).then(res => res.data),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useUpdateVideo() {
  return useAuthenticatedMutation(
    ({ videoId, data }) => apiService.videos.updateDetails(videoId, data),
    {
      invalidateQueries: [['video'], ['user-videos']],
    }
  );
}

// Comment-related hooks
export function useVideoComments(videoId, params = {}) {
  return useAuthenticatedQuery(
    ['comments', videoId, params],
    () => apiService.comments.getVideoComments(videoId, params).then(res => res.data),
    {
      enabled: !!videoId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useAddComment() {
  return useAuthenticatedMutation(
    (data) => apiService.comments.addComment(data),
    {
      invalidateQueries: [['comments']],
    }
  );
}

export function useReplyToComment() {
  return useAuthenticatedMutation(
    ({ commentId, text }) => apiService.comments.replyToComment(commentId, { text }),
    {
      invalidateQueries: [['comments']],
    }
  );
}

export function useDeleteComment() {
  return useAuthenticatedMutation(
    (commentId) => apiService.comments.deleteComment(commentId),
    {
      invalidateQueries: [['comments']],
    }
  );
}

// Note-related hooks
export function useNotes(params = {}) {
  return useAuthenticatedQuery(
    ['notes', params],
    () => apiService.notes.getAll(params).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useNote(noteId) {
  return useAuthenticatedQuery(
    ['note', noteId],
    () => apiService.notes.getById(noteId).then(res => res.data),
    {
      enabled: !!noteId,
    }
  );
}

export function useVideoNotes(videoId, params = {}) {
  return useAuthenticatedQuery(
    ['video-notes', videoId, params],
    () => apiService.notes.getByVideo(videoId, params).then(res => res.data),
    {
      enabled: !!videoId,
    }
  );
}

export function useCreateNote() {
  return useAuthenticatedMutation(
    (data) => apiService.notes.create(data),
    {
      invalidateQueries: [['notes'], ['video-notes'], ['note-stats']],
    }
  );
}

export function useUpdateNote() {
  return useAuthenticatedMutation(
    ({ noteId, data }) => apiService.notes.update(noteId, data),
    {
      invalidateQueries: [['notes'], ['note'], ['video-notes'], ['note-stats']],
    }
  );
}

export function useDeleteNote() {
  return useAuthenticatedMutation(
    ({ noteId, permanent }) => apiService.notes.delete(noteId, permanent),
    {
      invalidateQueries: [['notes'], ['video-notes'], ['note-stats']],
    }
  );
}

export function useNoteStats() {
  return useAuthenticatedQuery(
    ['note-stats'],
    () => apiService.notes.getStats().then(res => res.data),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useNoteTags() {
  return useAuthenticatedQuery(
    ['note-tags'],
    () => apiService.notes.getTags().then(res => res.data),
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
}

export function useSearchNotes() {
  return useAuthenticatedMutation(
    (params) => apiService.notes.search(params),
  );
}

export function useBulkNoteOperation() {
  return useAuthenticatedMutation(
    (data) => apiService.notes.bulkOperation(data),
    {
      invalidateQueries: [['notes'], ['video-notes'], ['note-stats']],
    }
  );
}

// Log-related hooks
export function useLogs(params = {}) {
  return useAuthenticatedQuery(
    ['logs', params],
    () => apiService.logs.getUserLogs(params).then(res => res.data),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useLogStats(params = {}) {
  return useAuthenticatedQuery(
    ['log-stats', params],
    () => apiService.logs.getStats(params).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useErrorLogs(params = {}) {
  return useAuthenticatedQuery(
    ['error-logs', params],
    () => apiService.logs.getErrors(params).then(res => res.data),
    {
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}

// Settings-related hooks
export function useUpdateSettings() {
  const { updateUser } = useAuth();
  
  return useAuthenticatedMutation(
    (settings) => apiService.auth.updateSettings(settings),
    {
      onSuccess: (response) => {
        if (response.data.success) {
          // Update user context with new settings
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            settings: response.data.settings
          };
          updateUser(updatedUser);
        }
      },
    }
  );
}

// Utility hooks for common patterns
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = React.useState(initialPage);
  const [limit, setLimit] = React.useState(initialLimit);

  const nextPage = () => setPage(prev => prev + 1);
  const prevPage = () => setPage(prev => Math.max(1, prev - 1));
  const goToPage = (pageNumber) => setPage(Math.max(1, pageNumber));
  const resetPage = () => setPage(1);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
  };
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Error handling hook
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error) => {
    console.error('Error caught by useErrorHandler:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}
