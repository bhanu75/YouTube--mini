
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
