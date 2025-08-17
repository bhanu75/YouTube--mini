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
