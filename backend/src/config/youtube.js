const { google } = require('googleapis');

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// YouTube API configuration
const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});

// OAuth scopes required for YouTube operations
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// YouTube API methods wrapper class
class YouTubeService {
  
  // Set credentials for authenticated requests
  static setCredentials(tokens) {
    oauth2Client.setCredentials(tokens);
  }

  // Get video details by video ID
  static async getVideoDetails(videoId) {
    try {
      const response = await youtube.videos.list({
        part: ['snippet', 'statistics', 'status', 'contentDetails'],
        id: [videoId]
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      return response.data.items[0];
    } catch (error) {
      console.error('Error fetching video details:', error.message);
      throw error;
    }
  }

  // Update video details (title, description, tags)
  static async updateVideo(videoId, updateData) {
    try {
      const { title, description, tags, categoryId } = updateData;
      
      const response = await youtube.videos.update({
        part: ['snippet'],
        requestBody: {
          id: videoId,
          snippet: {
            title,
            description,
            tags: tags || [],
            categoryId: categoryId || '22' // Default to People & Blogs
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating video:', error.message);
      throw error;
    }
  }

  // Get video comments
  static async getVideoComments(videoId, maxResults = 20, pageToken = '') {
    try {
      const response = await youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId,
        maxResults,
        pageToken,
        order: 'time'
      });

      return {
        comments: response.data.items,
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo.totalResults
      };
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      throw error;
    }
  }

  // Add comment to video
  static async addComment(videoId, text) {
    try {
      const response = await youtube.commentThreads.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            videoId,
            topLevelComment: {
              snippet: {
                textOriginal: text
              }
            }
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error.message);
      throw error;
    }
  }

  // Reply to comment
  static async replyToComment(parentId, text) {
    try {
      const response = await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId,
            textOriginal: text
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error.message);
      throw error;
    }
  }

  // Delete comment
  static async deleteComment(commentId) {
    try {
      await youtube.comments.delete({
        id: commentId
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error.message);
      throw error;
    }
  }

  // Get user's channel info
  static async getChannelInfo() {
    try {
      const response = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        mine: true
      });

      if (response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      return response.data.items[0];
    } catch (error) {
      console.error('Error fetching channel info:', error.message);
      throw error;
    }
  }

  // Get user's videos
  static async getUserVideos(channelId, maxResults = 25, pageToken = '') {
    try {
      const response = await youtube.search.list({
        part: ['snippet'],
        channelId,
        type: 'video',
        order: 'date',
        maxResults,
        pageToken
      });

      return {
        videos: response.data.items,
        nextPageToken: response.data.nextPageToken,
        totalResults: response.data.pageInfo.totalResults
      };
    } catch (error) {
      console.error('Error fetching user videos:', error.message);
      throw error;
    }
  }
}

module.exports = {
  oauth2Client,
  youtube,
  SCOPES,
  YouTubeService
};
