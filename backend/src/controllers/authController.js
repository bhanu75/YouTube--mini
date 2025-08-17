
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { oauth2Client, SCOPES, YouTubeService } = require('../config/youtube');
const { TokenManager } = require('../utils/encryption');
const { Logger } = require('../utils/logger');
const EventLog = require('../models/EventLog');

class AuthController {
  
  // Generate authentication URL
  static async getAuthUrl(req, res) {
    try {
      const sessionId = TokenManager.generateSessionId();
      const state = TokenManager.generateCorrelationId();
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // Force consent screen to get refresh token
        state: JSON.stringify({ sessionId, timestamp: Date.now() }),
        include_granted_scopes: true
      });

      res.json({
        success: true,
        authUrl,
        sessionId,
        message: 'Authentication URL generated successfully'
      });

    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate authentication URL'
      });
    }
  }

  // Handle OAuth callback
  static async handleCallback(req, res) {
    try {
      const { code, state, error: oauthError } = req.query;

      // Check for OAuth errors
      if (oauthError) {
        return res.status(400).json({
          success: false,
          message: `Authentication failed: ${oauthError}`
        });
      }

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code not provided'
        });
      }

      // Verify state parameter (CSRF protection)
      let stateData;
      try {
        stateData = JSON.parse(state);
        const timeDiff = Date.now() - stateData.timestamp;
        if (timeDiff > 600000) { // 10 minutes
          throw new Error('State expired');
        }
      } catch (stateError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state parameter'
        });
      }

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
      );
      const userInfo = await userInfoResponse.json();

      if (!userInfo.id) {
        return res.status(400).json({
          success: false,
          message: 'Failed to retrieve user information'
        });
      }

      // Get YouTube channel info
      let channelInfo = null;
      try {
        channelInfo = await YouTubeService.getChannelInfo();
      } catch (channelError) {
        console.warn('Could not fetch channel info:', channelError.message);
      }

      // Find or create user
      let user = await User.findOne({ googleId: userInfo.id });
      
      if (user) {
        // Update existing user
        user.email = userInfo.email;
        user.name = userInfo.name;
        user.picture = userInfo.picture;
        user.encryptedTokens = TokenManager.encrypt(tokens);
        user.lastLogin = new Date();
        
        if (channelInfo) {
          user.channelId = channelInfo.id;
          user.channelTitle = channelInfo.snippet.title;
        }
        
        await user.save();
      } else {
        // Create new user
        user = new User({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          channelId: channelInfo?.id || '',
          channelTitle: channelInfo?.snippet?.title || '',
          encryptedTokens: TokenManager.encrypt(tokens),
          lastLogin: new Date()
        });
        
        await user.save();
      }

      // Generate JWT token
      const jwtPayload = {
        userId: user._id,
        googleId: user.googleId,
        email: user.email,
        sessionId: stateData.sessionId,
        tokenVersion: 1 // For token invalidation if needed
      };

      const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: '7d'
      });

      // Log successful login
      await Logger.logActivity(
        user._id, 
        'LOGIN', 
        'User logged in successfully',
        {
          sessionId: stateData.sessionId,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          hasRefreshToken: !!tokens.refresh_token
        }
      );

      // Send response
      res.json({
        success: true,
        message: 'Authentication successful',
        token: jwtToken,
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          channelId: user.channelId,
          channelTitle: user.channelTitle,
          lastLogin: user.lastLogin
        }
      });

    } catch (error) {
      console.error('OAuth callback error:', error);
      
      res.status(400).json({
        success: false,
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get current user info
  static async getCurrentUser(req, res) {
    try {
      const user = req.user;
      
      // Get latest channel info
      let channelInfo = null;
      try {
        channelInfo = await YouTubeService.getChannelInfo();
        
        // Update channel info if changed
        if (channelInfo && (user.channelId !== channelInfo.id || user.channelTitle !== channelInfo.snippet.title)) {
          user.channelId = channelInfo.id;
          user.channelTitle = channelInfo.snippet.title;
          await user.save();
        }
      } catch (channelError) {
        console.warn('Could not fetch channel info:', channelError.message);
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          channelId: user.channelId,
          channelTitle: user.channelTitle,
          lastLogin: user.lastLogin,
          settings: user.settings,
          isActive: user.isActive
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user information'
      });
    }
  }

  // Refresh JWT token
  static async refreshToken(req, res) {
    try {
      const user = req.user;
      
      // Generate new JWT token
      const jwtPayload = {
        userId: user._id,
        googleId: user.googleId,
        email: user.email,
        sessionId: TokenManager.generateSessionId(),
        tokenVersion: 1
      };

      const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: '7d'
      });

      // Log token refresh
      await Logger.logActivity(
        user._id,
        'TOKEN_REFRESH',
        'JWT token refreshed',
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      );

      res.json({
        success: true,
        token: jwtToken,
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token'
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      const user = req.user;

      // Revoke Google tokens
      try {
        const tokens = TokenManager.decrypt(user.encryptedTokens);
        if (tokens.access_token) {
          await oauth2Client.revokeToken(tokens.access_token);
        }
      } catch (revokeError) {
        console.warn('Token revocation failed:', revokeError.message);
      }

      // Clear encrypted tokens from database
      user.encryptedTokens = '';
      await user.save();

      // Log logout
      await Logger.logActivity(
        user._id,
        'LOGOUT',
        'User logged out',
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      );

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  // Update user settings
  static async updateSettings(req, res) {
    try {
      const user = req.user;
      const { theme, notifications, autoSync } = req.body;

      // Update settings
      if (theme) user.settings.theme = theme;
      if (notifications) user.settings.notifications = { ...user.settings.notifications, ...notifications };
      if (typeof autoSync === 'boolean') user.settings.autoSync = autoSync;

      await user.save();

      // Log settings update
      await Logger.logActivity(
        user._id,
        'SETTINGS_UPDATE',
        'User settings updated',
        {
          updatedFields: Object.keys(req.body),
          newSettings: user.settings
        }
      );

      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: user.settings
      });

    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const user = req.user;
      const { confirmDelete } = req.body;

      if (!confirmDelete) {
        return res.status(400).json({
          success: false,
          message: 'Account deletion confirmation required'
        });
      }

      // Revoke tokens
      try {
        const tokens = TokenManager.decrypt(user.encryptedTokens);
        if (tokens.access_token) {
          await oauth2Client.revokeToken(tokens.access_token);
        }
      } catch (revokeError) {
        console.warn('Token revocation failed during account deletion:', revokeError.message);
      }

      // Log account deletion before deleting user
      await Logger.logActivity(
        user._id,
        'ACCOUNT_DELETE',
        'User account deleted',
        {
          email: user.email,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      );

      // Delete user and all associated data
      await User.findByIdAndDelete(user._id);
      
      // Note: In production, you might want to soft delete or anonymize data
      // instead of hard deletion for compliance purposes

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account'
      });
    }
  }
}

module.exports = AuthController;
