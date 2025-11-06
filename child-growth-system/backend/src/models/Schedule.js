const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageRecipient',
    required: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  scheduleType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'once'],
    required: true
  },

  timing: {
    time: {
      type: String,
      required: true // مثل '08:00'
    },
    days: [{
      type: Number,
      min: 0,
      max: 6 // 0=Sunday, 6=Saturday
    }],
    dayOfMonth: Number, // للشهري
    timezone: {
      type: String,
      default: 'Africa/Cairo'
    }
  },

  messageTemplate: {
    type: {
      type: String,
      enum: ['weather', 'tip', 'activity', 'reminder', 'question', 'greeting', 'report', 'custom'],
      required: true
    },
    content: String,
    variables: mongoose.Schema.Types.Mixed,
    useAI: {
      type: Boolean,
      default: false
    },
    aiModel: {
      type: String,
      enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3.5'],
      default: 'gpt-4'
    },
    aiPromptTemplate: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastSent: Date,

  nextRun: Date,

  statistics: {
    totalSent: {
      type: Number,
      default: 0
    },
    successfulSent: {
      type: Number,
      default: 0
    },
    failedSent: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number, // بالدقائق
    lastError: String
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ familyId: 1, isActive: 1 });
scheduleSchema.index({ nextRun: 1, isActive: 1 });
scheduleSchema.index({ recipientId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
