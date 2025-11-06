const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },

  type: {
    type: String,
    enum: ['activity', 'book', 'video', 'course', 'place', 'food', 'game', 'app', 'other'],
    required: true
  },

  category: {
    type: String,
    enum: ['educational', 'entertainment', 'health', 'sports', 'creative', 'social', 'cognitive']
  },

  content: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    url: String,
    thumbnailUrl: String,
    ageRange: String,
    duration: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    materials: [String],
    steps: [String],
    benefits: [String]
  },

  aiGenerated: {
    type: Boolean,
    default: false
  },

  generatedPrompt: String,

  targetAudience: {
    type: String,
    enum: ['child', 'parents', 'both'],
    default: 'both'
  },

  status: {
    sent: {
      type: Boolean,
      default: false
    },
    sentDate: Date,
    opened: {
      type: Boolean,
      default: false
    },
    openedDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    skipped: {
      type: Boolean,
      default: false
    }
  },

  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    wouldRecommend: Boolean,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
recommendationSchema.index({ familyId: 1, childId: 1 });
recommendationSchema.index({ type: 1, category: 1 });
recommendationSchema.index({ 'status.sent': 1, 'status.completed': 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
