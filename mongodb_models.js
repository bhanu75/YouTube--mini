// ============================================
// FILE: backend/src/models/User.js
// ============================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: {
    type: String,
    default: ''
  },
  channelId: {
    type: String,
    default: ''
  },
  channelTitle: {
    type: String,
    default: ''
  },
  encryptedTokens: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: true
      },
      uploads: {
        type: Boolean,
        default: true
      }
    },
    autoSync: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.encryptedTokens;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true }).sort({ lastLogin: -1 });
};

module.exports = mongoose.model('User', userSchema);

// ============================================
// FILE: backend/src/models/Note.js
// ============================================

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  videoId: {
    type: String,
    required: true,
    index: true
  },
  videoTitle: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  category: {
    type: String,
    enum: ['general', 'idea', 'todo', 'research', 'feedback', 'bug', 'feature'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  color: {
    type: String,
    enum: ['yellow', 'blue', 'green', 'red', 'purple', 'orange', 'pink'],
    default: 'yellow'
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date,
    default: null
  },
  attachments: [{
    fileName: String,
    fileType: String,
    fileSize: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  linkedNotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date,
      default: Date.now
    },
    viewCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better search performance
noteSchema.index({ userId: 1, videoId: 1 });
noteSchema.index({ userId: 1, status: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ category: 1, priority: 1 });
noteSchema.index({ title: 'text', content: 'text' });

// Virtual for excerpt
noteSchema.virtual('excerpt').get(function() {
  return this.content.length > 150 
    ? this.content.substring(0, 150) + '...' 
    : this.content;
});

// Pre-save middleware to calculate metadata
noteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const words = this.content.split(/\s+/).length;
    this.metadata.wordCount = words;
    this.metadata.readingTime = Math.ceil(words / 200); // 200 words per minute
  }
  next();
});

// Method to increment view count
noteSchema.methods.incrementViewCount = function() {
  this.metadata.viewCount += 1;
  this.metadata.lastViewed = new Date();
  return this.save();
};

// Static method to get notes by video
noteSchema.statics.getByVideoId = function(userId, videoId) {
  return this.find({ userId, videoId, status: { $ne: 'archived' } })
    .sort({ createdAt: -1 });
};

// Static method to search notes
noteSchema.statics.searchNotes = function(userId, query, filters = {}) {
  const searchCriteria = { userId };
  
  if (query) {
    searchCriteria.$text = { $search: query };
  }
  
  if (filters.category) {
    searchCriteria.category = filters.category;
  }
  
  if (filters.status) {
    searchCriteria.status = filters.status;
  }
  
  if (filters.priority) {
    searchCriteria.priority = filters.priority;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    searchCriteria.tags = { $in: filters.tags };
  }
  
  return this.find(searchCriteria)
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(filters.limit || 50);
};

module.exports = mongoose.model('Note', noteSchema);

// ============================================
// FILE: backend/src/models/EventLog.js
// ============================================

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