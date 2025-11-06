const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },

  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recommendation'
  },

  activityType: {
    type: String,
    enum: ['physical', 'educational', 'creative', 'social', 'outdoor', 'indoor', 'other'],
    required: true
  },

  activityName: {
    type: String,
    required: true
  },

  description: String,

  date: {
    type: Date,
    required: true,
    default: Date.now
  },

  duration: {
    type: Number, // بالدقائق
    min: 0
  },

  participants: [{
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent'
    },
    role: {
      type: String,
      enum: ['supervisor', 'participant', 'observer']
    }
  }],

  details: {
    location: {
      type: String,
      enum: ['home', 'park', 'school', 'club', 'other']
    },
    weather: String,
    mood: {
      type: String,
      enum: ['happy', 'excited', 'neutral', 'tired', 'upset']
    },
    energyLevel: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  },

  outcomes: {
    completed: {
      type: Boolean,
      default: true
    },
    enjoymentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    skillsDeveloped: [String],
    challenges: [String],
    achievements: [String]
  },

  media: [{
    type: {
      type: String,
      enum: ['photo', 'video']
    },
    url: String,
    caption: String
  }],

  parentNotes: String
}, {
  timestamps: true
});

// Indexes
activitySchema.index({ childId: 1, date: -1 });
activitySchema.index({ activityType: 1 });
activitySchema.index({ 'outcomes.completed': 1 });

module.exports = mongoose.model('Activity', activitySchema);
