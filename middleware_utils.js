// ============================================
// FILE: backend/src/middleware/auth.js
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { TokenManager } = require('../utils/encryption');
const { oauth2Client } = require('../config/youtube');
const EventLog = require('../models/EventLog');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not found or inactive.' 
      });
    }

    // Decrypt and check YouTube tokens
    try {
      const youtubeTokens = TokenManager.decrypt(user.encryptedTokens);
      
      // Check if tokens need refresh
      if (TokenManager.isTokenExpired(youtubeTokens)) {
        try {
          const refreshResult = await TokenManager.refreshTokens(user.encryptedTokens);
          if (refreshResult.success) {
            user.encryptedTokens = refreshResult.tokens;
            await user.save();
            
            // Set refreshed tokens for OAuth client
            oauth2Client.setCredentials(TokenManager.decrypt(refreshResult.tokens));
          } else {
            return res.status(401).json({ 
              success: false, 
              message: 'Token expired and refresh failed. Please re-authenticate.' 
            });
          }
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          return res.status(401).json({ 
            success: false, 
            message: 'Authentication failed. Please login again.' 
          });
        }
      } else {
        // Set valid tokens for OAuth client
        oauth2Client.setCredentials(youtubeTokens);
      }

      // Add user and OAuth client to request
      req.user = user;
      req.oauth2Client = oauth2Client;
      req.sessionId = decoded.sessionId || '';
      
      // Update last activity
      user.lastLogin = new Date();
      await user.save();

      next();

    } catch (tokenError) {
      console.error('Token decryption error:', tokenError);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid authentication tokens. Please login again.' 
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Log authentication error
    if (req.body?.userId) {
      await EventLog.logEvent({
        userId: req.body.userId,
        eventType: 'ERROR',
        description: 'Authentication middleware error',
        severity: 'error',
        metadata: {
          errorMessage: error.message,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed.' 
    });
  }
};

// Optional auth middleware (doesn't require authentication)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        const youtubeTokens = TokenManager.decrypt(user.encryptedTokens);
        oauth2Client.setCredentials(youtubeTokens);
        req.oauth2Client = oauth2Client;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };

// ============================================
// FILE: backend/src/middleware/errorHandler.js
// ============================================

const EventLog = require('../models/EventLog');

const errorHandler = async (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      success: false,
      message: `Validation Error: ${message}`,
      statusCode: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `${field} already exists`,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      statusCode: 401
    };
  }

  // YouTube API errors
  if (err.code === 403 && err.message.includes('quota')) {
    error = {
      success: false,
      message: 'YouTube API quota exceeded. Please try again later.',
      statusCode: 429
    };
  }

  if (err.code === 404 && err.message.includes('videoNotFound')) {
    error = {
      success: false,
      message: 'Video not found or not accessible',
      statusCode: 404
    };
  }

  // Log error to database
  try {
    if (req.user) {
      await EventLog.logEvent({
        userId: req.user._id,
        eventType: 'ERROR',
        description: `${req.method} ${req.originalUrl} - ${error.message}`,
        severity: error.statusCode >= 500 ? 'error' : 'warning',
        metadata: {
          errorCode: err.code,
          errorMessage: err.message,
          statusCode: error.statusCode,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          apiEndpoint: req.originalUrl,
          httpMethod: req.method,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
      });
    }
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

// ============================================
// FILE: backend/src/utils/encryption.js
// ============================================

const CryptoJS = require('crypto-js');
const { oauth2Client } = require('../config/youtube');

class TokenManager {
  // Encrypt tokens for database storage
  static encrypt(tokens) {
    try {
      const tokenString = JSON.stringify(tokens);
      return CryptoJS.AES.encrypt(tokenString, process.env.ENCRYPTION_KEY).toString();
    } catch (error) {
      throw new Error('Token encryption failed');
    }
  }

  // Decrypt tokens from database
  static decrypt(encryptedTokens) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedTokens, process.env.ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new Error('Token decryption failed');
    }
  }

  // Check if access token is expired
  static isTokenExpired(tokens) {
    if (!tokens.expiry_date) return true;
    const now = Date.now();
    const expiryTime = new Date(tokens.expiry_date).getTime();
    // Add 5 minute buffer before actual expiry
    return now >= (expiryTime - 300000);
  }

  // Refresh access token using refresh token
  static async refreshTokens(encryptedTokens) {
    try {
      const tokens = this.decrypt(encryptedTokens);
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token available');
      }

      oauth2Client.setCredentials(tokens);
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Merge new tokens with existing ones
      const updatedTokens = {
        ...tokens,
        ...credentials,
        // Ensure refresh token is preserved
        refresh_token: credentials.refresh_token || tokens.refresh_token
      };

      return {
        success: true,
        tokens: this.encrypt(updatedTokens)
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate secure session ID
  static generateSessionId() {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  // Generate correlation ID for request tracking
  static generateCorrelationId() {
    return CryptoJS.lib.WordArray.random(8).toString();
  }

  // Hash sensitive data for logging
  static hashForLogging(data) {
    return CryptoJS.SHA256(data.toString()).toString();
  }
}

module.exports = { TokenManager };

// ============================================
// FILE: backend/src/utils/logger.js
// ============================================

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