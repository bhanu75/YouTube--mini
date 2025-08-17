const EventLog = require('../models/EventLog');

class Logger {
  // Log user activity
  static async logActivity(userId, eventType, description, metadata = {}) {
    try {
      await EventLog.logEvent({
        userId,
        eventType,
        description,
        severity: 'info',
        metadata,
        source: 'system'
      });
    } catch (error) {
      console.error('Activity logging failed:', error);
    }
  }

  // Log API calls
  static async logApiCall(userId, endpoint, method, statusCode, duration, metadata = {}) {
    try {
      await EventLog.logEvent({
        userId,
        eventType: 'API_CALL',
        description: `${method} ${endpoint}`,
        severity: statusCode >= 400 ? 'warning' : 'info',
        metadata: {
          apiEndpoint: endpoint,
          httpMethod: method,
          statusCode,
          duration,
          ...metadata
        }
      });
    } catch (error) {
      console.error('API call logging failed:', error);
    }
  }

  // Log errors
  static async logError(userId, error, context = {}) {
    try {
      await EventLog.logEvent({
        userId,
        eventType: 'ERROR',
        description: error.message,
        severity: 'error',
        metadata: {
          errorMessage: error.message,
          errorStack: error.stack,
          ...context
        }
      });
    } catch (logError) {
      console.error('Error logging failed:', logError);
    }
  }

  // Log video operations
  static async logVideoOperation(userId, operation, videoId, videoTitle, metadata = {}) {
    try {
      await EventLog.logEvent({
        userId,
        eventType: `VIDEO_${operation.toUpperCase()}`,
        description: `${operation} video: ${videoTitle}`,
        resourceType: 'video',
        resourceId: videoId,
        metadata: {
          videoId,
          videoTitle,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Video operation logging failed:', error);
    }
  }

  // Log comment operations
  static async logCommentOperation(userId, operation, commentId, videoId, commentText = '', metadata = {}) {
    try {
      await EventLog.logEvent({
        userId,
        eventType: `COMMENT_${operation.toUpperCase()}`,
        description: `${operation} comment on video`,
        resourceType: 'comment',
        resourceId: commentId,
        metadata: {
          videoId,
          commentId,
          commentText: commentText.substring(0, 100), // Limit comment text length
          ...metadata
        }
      });
    } catch (error) {
      console.error('Comment operation logging failed:', error);
    }
  }

  // Log note operations
  static async logNoteOperation(userId, operation, noteId, noteTitle, metadata = {}) {
    try {
      await EventLog.logEvent({
        userId,
        eventType: `NOTE_${operation.toUpperCase()}`,
        description: `${operation} note: ${noteTitle}`,
        resourceType: 'note',
        resourceId: noteId,
        metadata: {
          noteId,
          noteTitle,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Note operation logging failed:', error);
    }
  }
}

// Middleware to log API requests
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log API call if user is authenticated
    if (req.user) {
      Logger.logApiCall(
        req.user._id,
        req.originalUrl,
        req.method,
        res.statusCode,
        duration,
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          responseSize: JSON.stringify(data).length
        }
      );
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = { Logger, requestLogger };
