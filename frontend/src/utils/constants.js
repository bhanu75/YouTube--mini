
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
