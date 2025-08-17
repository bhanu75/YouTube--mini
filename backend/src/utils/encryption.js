
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
