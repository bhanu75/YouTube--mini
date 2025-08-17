
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
