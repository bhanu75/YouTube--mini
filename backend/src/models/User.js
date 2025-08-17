
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
