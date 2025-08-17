// ============================================
// FILE: backend/src/controllers/videoController.js
// ============================================

const { YouTubeService } = require('../config/youtube');
const { Logger } = require('../utils/logger');
const Note = require('../models/Note');

class VideoController {

  // Get video details by ID
  static async getVideoDetails(req, res) {
    try {
      const { videoId } = req.params;
      const user = req.user;

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: 'Video ID is required'
        });
      }

      // Validate YouTube video ID format
      const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;
      if (!youtubeIdRegex.test(videoId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube video ID format'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // Fetch video details from YouTube API
      const videoDetails = await YouTubeService.getVideoDetails(videoId);

      // Get associated notes count
      const notesCount = await Note.countDocuments({
        userId: user._id,
        videoId: videoId,
        status: { $ne: 'archived' }
      });

      // Log video view
      await Logger.logVideoOperation(
        user._id,
        'VIEW',
        videoId,
        videoDetails.snippet.title,
        {
          viewCount: videoDetails.statistics.viewCount,
          duration: videoDetails.contentDetails.duration
        }
      );

      // Format response
      const response = {
        success: true,
        video: {
          id: videoDetails.id,
          title: videoDetails.snippet.title,
          description: videoDetails.snippet.description,
          thumbnails: videoDetails.snippet.thumbnails,
          publishedAt: videoDetails.snippet.publishedAt,
          channelId: videoDetails.snippet.channelId,
          channelTitle: videoDetails.snippet.channelTitle,
          tags: videoDetails.snippet.tags || [],
          categoryId: videoDetails.snippet.categoryId,
          defaultLanguage: videoDetails.snippet.defaultLanguage,
          defaultAudioLanguage: videoDetails.snippet.defaultAudioLanguage,
          statistics: {
            viewCount: parseInt(videoDetails.statistics.viewCount || 0),
            likeCount: parseInt(videoDetails.statistics.likeCount || 0),
            commentCount: parseInt(videoDetails.statistics.commentCount || 0)
          },
          contentDetails: {
            duration: videoDetails.contentDetails.duration,
            dimension: videoDetails.contentDetails.dimension,
            definition: videoDetails.contentDetails.definition,
            caption: videoDetails.contentDetails.caption
          },
          status: {
            uploadStatus: videoDetails.status.uploadStatus,
            privacyStatus: videoDetails.status.privacyStatus,
            license: videoDetails.status.license,
            embeddable: videoDetails.status.embeddable,
            publicStatsViewable: videoDetails.status.publicStatsViewable
          },
          notesCount
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Error fetching video details:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getVideoDetails',
        videoId: req.params.videoId
      });

      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Video not found or not accessible'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Check your permissions or API quota.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch video details'
      });
    }
  }

  // Update video details (title, description, tags)
  static async updateVideoDetails(req, res) {
    try {
      const { videoId } = req.params;
      const { title, description, tags, categoryId } = req.body;
      const user = req.user;

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: 'Video ID is required'
        });
      }

      // Validate required fields
      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Title and description are required'
        });
      }

      // Validate input lengths
      if (title.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title must be 100 characters or less'
        });
      }

      if (description.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Description must be 5000 characters or less'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // First, get current video details to compare
      const currentVideo = await YouTubeService.getVideoDetails(videoId);
      
      // Prepare update data
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()).slice(0, 500) : [],
        categoryId: categoryId || currentVideo.snippet.categoryId
      };

      // Update video on YouTube
      const updatedVideo = await YouTubeService.updateVideo(videoId, updateData);

      // Log the update operation
      await Logger.logVideoOperation(
        user._id,
        'UPDATE',
        videoId,
        updateData.title,
        {
          oldTitle: currentVideo.snippet.title,
          newTitle: updateData.title,
          descriptionChanged: currentVideo.snippet.description !== updateData.description,
          tagsChanged: JSON.stringify(currentVideo.snippet.tags || []) !== JSON.stringify(updateData.tags)
        }
      );

      res.json({
        success: true,
        message: 'Video updated successfully',
        video: {
          id: updatedVideo.id,
          title: updatedVideo.snippet.title,
          description: updatedVideo.snippet.description,
          tags: updatedVideo.snippet.tags,
          categoryId: updatedVideo.snippet.categoryId,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error updating video:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'updateVideoDetails',
        videoId: req.params.videoId,
        updateData: req.body
      });

      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Video not found or not accessible'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You may not have permission to edit this video.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update video'
      });
    }
  }

  // Get user's videos
  static async getUserVideos(req, res) {
    try {
      const user = req.user;
      const { 
        maxResults = 25, 
        pageToken = '', 
        order = 'date',
        channelId 
      } = req.query;

      // Use provided channelId or user's channelId
      const targetChannelId = channelId || user.channelId;

      if (!targetChannelId) {
        return res.status(400).json({
          success: false,
          message: 'Channel ID not found. Please ensure your YouTube channel is properly linked.'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // Fetch user's videos
      const videosData = await YouTubeService.getUserVideos(
        targetChannelId,
        parseInt(maxResults),
        pageToken
      );

      // Get notes count for each video
      const videoIds = videosData.videos.map(video => video.id.videoId || video.id);
      const notesCountByVideo = await Note.aggregate([
        {
          $match: {
            userId: user._id,
            videoId: { $in: videoIds },
            status: { $ne: 'archived' }
          }
        },
        {
          $group: {
            _id: '$videoId',
            count: { $sum: 1 }
          }
        }
      ]);

      const notesCountMap = notesCountByVideo.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      // Format videos response
      const formattedVideos = videosData.videos.map(video => ({
        id: video.id.videoId || video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnails: video.snippet.thumbnails,
        publishedAt: video.snippet.publishedAt,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        notesCount: notesCountMap[video.id.videoId || video.id] || 0
      }));

      // Log operation
      await Logger.logActivity(
        user._id,
        'VIDEO_FETCH',
        `Fetched ${formattedVideos.length} user videos`,
        {
          channelId: targetChannelId,
          resultCount: formattedVideos.length,
          hasNextPage: !!videosData.nextPageToken
        }
      );

      res.json({
        success: true,
        videos: formattedVideos,
        pagination: {
          nextPageToken: videosData.nextPageToken,
          totalResults: videosData.totalResults,
          resultsPerPage: parseInt(maxResults)
        }
      });

    } catch (error) {
      console.error('Error fetching user videos:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getUserVideos',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch videos'
      });
    }
  }

  // Get video analytics (basic stats)
  static async getVideoAnalytics(req, res) {
    try {
      const { videoId } = req.params;
      const user = req.user;

      if (!videoId) {
        return res.status(400).json({
          success: false,
          message: 'Video ID is required'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // Get video details
      const videoDetails = await YouTubeService.getVideoDetails(videoId);

      // Get comments data
      const commentsData = await YouTubeService.getVideoComments(videoId, 1);

      // Get notes analytics
      const notesStats = await Note.aggregate([
        {
          $match: {
            userId: user._id,
            videoId: videoId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const notesAnalytics = {
        total: notesStats.reduce((sum, stat) => sum + stat.count, 0),
        active: notesStats.find(stat => stat._id === 'active')?.count || 0,
        completed: notesStats.find(stat => stat._id === 'completed')?.count || 0,
        archived: notesStats.find(stat => stat._id === 'archived')?.count || 0
      };

      // Format analytics response
      const analytics = {
        video: {
          id: videoDetails.id,
          title: videoDetails.snippet.title,
          publishedAt: videoDetails.snippet.publishedAt
        },
        statistics: {
          viewCount: parseInt(videoDetails.statistics.viewCount || 0),
          likeCount: parseInt(videoDetails.statistics.likeCount || 0),
          commentCount: parseInt(videoDetails.statistics.commentCount || 0),
          engagement: {
            likeRatio: videoDetails.statistics.viewCount > 0 
              ? ((videoDetails.statistics.likeCount || 0) / videoDetails.statistics.viewCount * 100).toFixed(2)
              : 0,
            commentRatio: videoDetails.statistics.viewCount > 0
              ? ((videoDetails.statistics.commentCount || 0) / videoDetails.statistics.viewCount * 100).toFixed(2)
              : 0
          }
        },
        notes: notesAnalytics,
        lastFetched: new Date().toISOString()
      };

      res.json({
        success: true,
        analytics
      });

    } catch (error) {
      console.error('Error fetching video analytics:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getVideoAnalytics',
        videoId: req.params.videoId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch video analytics'
      });
    }
  }
}

module.exports = VideoController;

// ============================================
// FILE: backend/src/routes/videos.js
// ============================================

const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const { authMiddleware } = require('../middleware/auth');
const { requestLogger } = require('../utils/logger');

// Apply authentication and logging to all video routes
router.use(authMiddleware);
router.use(requestLogger);

// Video routes
router.get('/my-videos', VideoController.getUserVideos);
router.get('/:videoId', VideoController.getVideoDetails);
router.put('/:videoId', VideoController.updateVideoDetails);
router.get('/:videoId/analytics', VideoController.getVideoAnalytics);

module.exports = router;