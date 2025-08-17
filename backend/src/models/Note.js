
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
