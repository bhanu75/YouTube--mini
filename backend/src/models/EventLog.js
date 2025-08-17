
const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'LOGIN', 'LOGOUT', 'TOKEN_REFRESH',
      
      // Video events
      'VIDEO_VIEW', 'VIDEO_UPDATE', 'VIDEO_FETCH',
      
      // Comment events
      'COMMENT_ADD', 'COMMENT_REPLY', 'COMMENT_DELETE', 'COMMENT_FETCH',
      
      // Note events
      'NOTE_CREATE', 'NOTE_UPDATE', 'NOTE_DELETE', 'NOTE_VIEW', 'NOTE_SEARCH',
      
      // System events
      'ERROR', 'API_CALL', 'RATE_LIMIT', 'SETTINGS_UPDATE'
    ],
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  resourceType: {
    type: String,
    enum: ['video', 'comment', 'note', 'user', 'system'],
    default: 'system'
  },
  resourceId: {
    type: String,
    default: ''
  },
  metadata: {
    videoId: String,
    commentId: String,
    noteId: String,
    videoTitle: String,
    commentText: String,
    noteTitle: String,
    userAgent: String,
    ipAddress: String,
    duration: Number, // milliseconds
    apiEndpoint: String,
    httpMethod: String,
    statusCode: Number,
    errorCode: String,
    errorMessage: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
    index: true
  },
  source: {
    type: String,
    enum: ['web', 'api', 'system', 'scheduled'],
    default: 'web'
  },
  sessionId: {
    type: String,
    default: ''
  },
  correlationId: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We're using custom timestamp field
  capped: { size: 100000000, max: 1000000 } // 100MB cap, max 1M documents
});

// Compound indexes for efficient querying
eventLogSchema.index({ userId: 1, timestamp: -1 });
eventLogSchema.index({ eventType: 1, timestamp: -1 });
eventLogSchema.index({ severity: 1, timestamp: -1 });
eventLogSchema.index({ resourceType: 1, resourceId: 1 });

// TTL index to auto-delete old logs (90 days)
eventLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static method to log events
eventLogSchema.statics.logEvent = function(eventData) {
  const logEntry = new this({
    userId: eventData.userId,
    eventType: eventData.eventType,
    description: eventData.description,
    resourceType: eventData.resourceType || 'system',
    resourceId: eventData.resourceId || '',
    metadata: eventData.metadata || {},
    severity: eventData.severity || 'info',
    source: eventData.source || 'web',
    sessionId: eventData.sessionId || '',
    correlationId: eventData.correlationId || '',
    timestamp: new Date()
  });
  
  return logEntry.save();
};

// Static method to get user activity logs
eventLogSchema.statics.getUserLogs = function(userId, options = {}) {
  const query = { userId };
  
  if (options.eventType) {
    query.eventType = options.eventType;
  }
  
  if (options.severity) {
    query.severity = options.severity;
  }
  
  if (options.resourceType) {
    query.resourceType = options.resourceType;
  }
  
  if (options.startDate && options.endDate) {
    query.timestamp = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .populate('userId', 'name email');
};

// Static method to get activity statistics
eventLogSchema.statics.getActivityStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Method to format log for display
eventLogSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    eventType: this.eventType,
    description: this.description,
    severity: this.severity,
    timestamp: this.timestamp,
    resourceType: this.resourceType,
    resourceId: this.resourceId,
    metadata: {
      videoTitle: this.metadata.videoTitle,
      noteTitle: this.metadata.noteTitle,
      duration: this.metadata.duration,
      statusCode: this.metadata.statusCode
    }
  };
};

module.exports = mongoose.model('EventLog', eventLogSchema);
