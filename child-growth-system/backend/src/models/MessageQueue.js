const mongoose = require('mongoose');

const messageQueueSchema = new mongoose.Schema({
  recipientType: {
    type: String,
    enum: ['individual', 'group'],
    required: true
  },

  recipientId: {
    type: String, // phone number or group ID
    required: true
  },

  message: {
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'document', 'audio', 'video'],
      default: 'text'
    },
    mediaUrl: String,
    caption: String
  },

  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },

  scheduledFor: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },

  attempts: {
    type: Number,
    default: 0
  },

  maxAttempts: {
    type: Number,
    default: 3
  },

  errorLog: [{
    attempt: Number,
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  metadata: {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family'
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule'
    },
    messageId: String, // WhatsApp Message ID
    source: {
      type: String,
      enum: ['schedule', 'manual', 'ai', 'system']
    }
  },

  sentAt: Date,
  deliveredAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes
messageQueueSchema.index({ status: 1, scheduledFor: 1 });
messageQueueSchema.index({ recipientId: 1, status: 1 });
messageQueueSchema.index({ priority: -1, scheduledFor: 1 });

module.exports = mongoose.model('MessageQueue', messageQueueSchema);
