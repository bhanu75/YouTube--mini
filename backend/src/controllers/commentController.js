
const { YouTubeService } = require('../config/youtube');
const { Logger } = require('../utils/logger');

class CommentController {

  // Get video comments
  static async getVideoComments(req, res) {
    try {
      const { videoId } = req.params;
      const { 
        maxResults = 20, 
        pageToken = '', 
        order = 'time' 
      } = req.query;
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

      // Fetch comments from YouTube API
      const commentsData = await YouTubeService.getVideoComments(
        videoId,
        parseInt(maxResults),
        pageToken
      );

      // Format comments response
      const formattedComments = commentsData.comments.map(commentThread => {
        const topComment = commentThread.snippet.topLevelComment.snippet;
        const replies = commentThread.replies ? 
          commentThread.replies.comments.map(reply => ({
            id: reply.id,
            text: reply.snippet.textDisplay,
            author: {
              name: reply.snippet.authorDisplayName,
              profileImageUrl: reply.snippet.authorProfileImageUrl,
              channelUrl: reply.snippet.authorChannelUrl,
              channelId: reply.snippet.authorChannelId?.value
            },
            publishedAt: reply.snippet.publishedAt,
            updatedAt: reply.snippet.updatedAt,
            likeCount: reply.snippet.likeCount,
            parentId: reply.snippet.parentId,
            canRate: reply.snippet.canRate,
            moderationStatus: reply.snippet.moderationStatus
          })) : [];

        return {
          id: commentThread.id,
          videoId: topComment.videoId,
          text: topComment.textDisplay,
          textOriginal: topComment.textOriginal,
          author: {
            name: topComment.authorDisplayName,
            profileImageUrl: topComment.authorProfileImageUrl,
            channelUrl: topComment.authorChannelUrl,
            channelId: topComment.authorChannelId?.value
          },
          publishedAt: topComment.publishedAt,
          updatedAt: topComment.updatedAt,
          likeCount: topComment.likeCount,
          totalReplyCount: commentThread.snippet.totalReplyCount || 0,
          canRate: topComment.canRate,
          canReply: commentThread.snippet.canReply,
          moderationStatus: topComment.moderationStatus,
          isAuthorChannelOwner: topComment.authorChannelId?.value === user.channelId,
          replies: replies
        };
      });

      // Log comment fetch operation
      await Logger.logActivity(
        user._id,
        'COMMENT_FETCH',
        `Fetched ${formattedComments.length} comments for video`,
        {
          videoId,
          resultCount: formattedComments.length,
          hasNextPage: !!commentsData.nextPageToken
        }
      );

      res.json({
        success: true,
        comments: formattedComments,
        pagination: {
          nextPageToken: commentsData.nextPageToken,
          totalResults: commentsData.totalResults,
          resultsPerPage: parseInt(maxResults)
        }
      });

    } catch (error) {
      console.error('Error fetching comments:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getVideoComments',
        videoId: req.params.videoId,
        query: req.query
      });

      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Video not found or comments are disabled'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Comments may be disabled or private.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  // Add comment to video
  static async addComment(req, res) {
    try {
      const { videoId, text } = req.body;
      const user = req.user;

      // Validate input
      if (!videoId || !text) {
        return res.status(400).json({
          success: false,
          message: 'Video ID and comment text are required'
        });
      }

      // Validate comment length
      if (text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Comment text cannot be empty'
        });
      }

      if (text.length > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Comment text must be 10,000 characters or less'
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

      // Add comment via YouTube API
      const commentResponse = await YouTubeService.addComment(videoId, text.trim());

      // Extract comment data
      const commentData = commentResponse.snippet.topLevelComment.snippet;

      // Log comment addition
      await Logger.logCommentOperation(
        user._id,
        'ADD',
        commentResponse.id,
        videoId,
        text.trim(),
        {
          commentLength: text.trim().length,
          publishedAt: commentData.publishedAt
        }
      );

      // Format response
      const formattedComment = {
        id: commentResponse.id,
        videoId: commentData.videoId,
        text: commentData.textDisplay,
        textOriginal: commentData.textOriginal,
        author: {
          name: commentData.authorDisplayName,
          profileImageUrl: commentData.authorProfileImageUrl,
          channelUrl: commentData.authorChannelUrl,
          channelId: commentData.authorChannelId?.value
        },
        publishedAt: commentData.publishedAt,
        updatedAt: commentData.updatedAt,
        likeCount: commentData.likeCount || 0,
        canRate: commentData.canRate,
        moderationStatus: commentData.moderationStatus
      };

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        comment: formattedComment
      });

    } catch (error) {
      console.error('Error adding comment:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'addComment',
        videoId: req.body.videoId,
        commentLength: req.body.text?.length
      });

      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Comments may be disabled for this video.'
        });
      }

      if (error.message.includes('commentDisabled')) {
        return res.status(400).json({
          success: false,
          message: 'Comments are disabled for this video'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }

  // Reply to comment
  static async replyToComment(req, res) {
    try {
      const { commentId } = req.params;
      const { text } = req.body;
      const user = req.user;

      // Validate input
      if (!commentId || !text) {
        return res.status(400).json({
          success: false,
          message: 'Comment ID and reply text are required'
        });
      }

      // Validate reply text
      if (text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Reply text cannot be empty'
        });
      }

      if (text.length > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Reply text must be 10,000 characters or less'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // Add reply via YouTube API
      const replyResponse = await YouTubeService.replyToComment(commentId, text.trim());

      // Extract reply data
      const replyData = replyResponse.snippet;

      // Log reply addition
      await Logger.logCommentOperation(
        user._id,
        'REPLY',
        replyResponse.id,
        '', // No direct video ID in reply
        text.trim(),
        {
          parentCommentId: commentId,
          replyLength: text.trim().length,
          publishedAt: replyData.publishedAt
        }
      );

      // Format response
      const formattedReply = {
        id: replyResponse.id,
        text: replyData.textDisplay,
        textOriginal: replyData.textOriginal,
        author: {
          name: replyData.authorDisplayName,
          profileImageUrl: replyData.authorProfileImageUrl,
          channelUrl: replyData.authorChannelUrl,
          channelId: replyData.authorChannelId?.value
        },
        publishedAt: replyData.publishedAt,
        updatedAt: replyData.updatedAt,
        likeCount: replyData.likeCount || 0,
        parentId: replyData.parentId,
        canRate: replyData.canRate,
        moderationStatus: replyData.moderationStatus
      };

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        reply: formattedReply
      });

    } catch (error) {
      console.error('Error adding reply:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'replyToComment',
        parentCommentId: req.params.commentId,
        replyLength: req.body.text?.length
      });

      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You may not have permission to reply to this comment.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add reply'
      });
    }
  }

  // Delete comment
  static async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const user = req.user;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: 'Comment ID is required'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // Delete comment via YouTube API
      await YouTubeService.deleteComment(commentId);

      // Log comment deletion
      await Logger.logCommentOperation(
        user._id,
        'DELETE',
        commentId,
        '', // No direct video ID available
        '',
        {
          deletedAt: new Date().toISOString()
        }
      );

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting comment:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'deleteComment',
        commentId: req.params.commentId
      });

      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      if (error.code === 403) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own comments.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }

  // Get comment by ID (for editing purposes)
  static async getComment(req, res) {
    try {
      const { commentId } = req.params;
      const user = req.user;

      if (!commentId) {
        return res.status(400).json({
          success: false,
          message: 'Comment ID is required'
        });
      }

      // Set credentials for authenticated user
      YouTubeService.setCredentials(req.oauth2Client.credentials);

      // Note: YouTube API doesn't have a direct "get comment by ID" endpoint
      // This is a placeholder for potential future functionality
      // In practice, you'd need to fetch comments from the video and find the specific one

      res.status(501).json({
        success: false,
        message: 'Get single comment functionality not yet implemented'
      });

    } catch (error) {
      console.error('Error fetching comment:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch comment'
      });
    }
  }

  // Get comment statistics for a video
  static async getCommentStats(req, res) {
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

      // Get video details for comment count
      const videoDetails = await YouTubeService.getVideoDetails(videoId);

      // Get a sample of comments to analyze
      const commentsData = await YouTubeService.getVideoComments(videoId, 50);

      // Analyze comments
      const totalComments = parseInt(videoDetails.statistics.commentCount || 0);
      const sampleComments = commentsData.comments;
      
      // Calculate basic statistics
      const avgCommentLength = sampleComments.length > 0 
        ? sampleComments.reduce((sum, comment) => 
            sum + comment.snippet.topLevelComment.snippet.textOriginal.length, 0) / sampleComments.length
        : 0;

      const totalReplies = sampleComments.reduce((sum, comment) => 
        sum + (comment.snippet.totalReplyCount || 0), 0);

      const avgLikesPerComment = sampleComments.length > 0
        ? sampleComments.reduce((sum, comment) => 
            sum + (comment.snippet.topLevelComment.snippet.likeCount || 0), 0) / sampleComments.length
        : 0;

      // Count user's own comments
      const userComments = sampleComments.filter(comment => 
        comment.snippet.topLevelComment.snippet.authorChannelId?.value === user.channelId
      );

      const stats = {
        video: {
          id: videoId,
          title: videoDetails.snippet.title
        },
        overview: {
          totalComments,
          sampleSize: sampleComments.length,
          totalReplies,
          avgCommentLength: Math.round(avgCommentLength),
          avgLikesPerComment: Math.round(avgLikesPerComment * 100) / 100
        },
        userActivity: {
          userCommentsInSample: userComments.length,
          userCommentPercentage: sampleComments.length > 0 
            ? Math.round((userComments.length / sampleComments.length) * 10000) / 100
            : 0
        },
        engagement: {
          commentToViewRatio: videoDetails.statistics.viewCount > 0
            ? Math.round((totalComments / videoDetails.statistics.viewCount) * 10000) / 100
            : 0
        },
        lastAnalyzed: new Date().toISOString()
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error fetching comment stats:', error);

      // Log error
      await Logger.logError(req.user._id, error, {
        operation: 'getCommentStats',
        videoId: req.params.videoId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch comment statistics'
      });
    }
  }
}

module.exports = CommentController;
