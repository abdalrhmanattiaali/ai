const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },

  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  },

  message: {
    from: {
      type: String,
      enum: ['parent', 'system', 'admin'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'audio', 'document', 'video'],
      default: 'text'
    },
    mediaUrl: String
  },

  aiResponse: {
    content: String,
    type: {
      type: String,
      enum: ['advice', 'recommendation', 'question', 'greeting', 'general']
    },
    model: String, // 'gpt-4', 'claude-3.5', etc.
    tokensUsed: Number,
    generatedAt: Date
  },

  context: {
    topic: {
      type: String,
      enum: ['health', 'education', 'behavior', 'nutrition', 'safety', 'development', 'general']
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'concerned', 'urgent']
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    keywords: [String]
  },

  metadata: {
    messageId: String, // WhatsApp Message ID
    delivered: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    deliveredAt: Date
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ familyId: 1, timestamp: -1 });
conversationSchema.index({ parentId: 1, timestamp: -1 });
conversationSchema.index({ 'message.from': 1, timestamp: -1 });
conversationSchema.index({ 'context.topic': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
