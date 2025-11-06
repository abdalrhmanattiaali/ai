const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  familyName: {
    type: String,
    required: [true, 'يرجى إدخال اسم الأسرة'],
    trim: true
  },

  location: {
    city: {
      type: String,
      default: 'القاهرة'
    },
    country: {
      type: String,
      default: 'مصر'
    },
    coordinates: {
      lat: Number,
      lon: Number
    }
  },

  isActive: {
    type: Boolean,
    default: true
  },

  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },

  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    preferredLanguage: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    timezone: {
      type: String,
      default: 'Africa/Cairo'
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      from: {
        type: String,
        default: '22:00'
      },
      to: {
        type: String,
        default: '07:00'
      }
    }
  },

  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalRecommendations: {
      type: Number,
      default: 0
    },
    completedActivities: {
      type: Number,
      default: 0
    },
    lastActivityDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual للأطفال
familySchema.virtual('children', {
  ref: 'Child',
  localField: '_id',
  foreignField: 'familyId'
});

// Virtual للوالدين
familySchema.virtual('parents', {
  ref: 'Parent',
  localField: '_id',
  foreignField: 'familyId'
});

module.exports = mongoose.model('Family', familySchema);
