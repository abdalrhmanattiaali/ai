const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  // البيانات الأساسية
  name: {
    type: String,
    required: [true, 'يرجى إدخال الاسم'],
    trim: true
  },

  role: {
    type: String,
    enum: ['father', 'mother', 'guardian'],
    required: [true, 'يرجى تحديد الدور']
  },

  whatsappNumber: {
    type: String,
    required: [true, 'يرجى إدخال رقم الواتساب'],
    unique: true,
    match: [/^\+[1-9]\d{1,14}$/, 'رقم الواتساب غير صحيح (مثال: +201234567890)']
  },

  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'البريد الإلكتروني غير صالح']
  },

  profileImage: {
    type: String,
    default: null
  },

  // معلومات إضافية
  occupation: {
    type: String,
    trim: true
  },

  workSchedule: {
    workDays: [{
      type: String,
      enum: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    }],
    workHours: {
      from: String, // مثل '09:00'
      to: String // مثل '17:00'
    }
  },

  // التفضيلات
  preferences: {
    communicationStyle: {
      type: String,
      enum: ['formal', 'casual'],
      default: 'casual'
    },
    contentLevel: {
      type: String,
      enum: ['brief', 'detailed'],
      default: 'detailed'
    },
    interests: [{
      type: String // مثل: ['تربية', 'تعليم', 'صحة', 'تغذية']
    }],
    preferredLanguage: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    }
  },

  // مستوى الخبرة
  parentingExperience: {
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner'
    },
    previousChildren: {
      type: Number,
      default: 0,
      min: 0
    },
    challengesInterested: [{
      type: String
    }]
  },

  // حالة الإشعارات
  notificationSettings: {
    enabled: {
      type: Boolean,
      default: true
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
    },
    messageTypes: {
      daily: { type: Boolean, default: true },
      weekly: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      questions: { type: Boolean, default: true }
    }
  },

  // الإحصائيات
  statistics: {
    totalMessagesReceived: {
      type: Number,
      default: 0
    },
    totalMessagesSent: {
      type: Number,
      default: 0
    },
    lastInteraction: Date,
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index للبحث السريع
parentSchema.index({ familyId: 1 });
parentSchema.index({ whatsappNumber: 1 });

// تحديث آخر تفاعل
parentSchema.methods.updateLastInteraction = async function() {
  this.statistics.lastInteraction = new Date();
  await this.save();
};

module.exports = mongoose.model('Parent', parentSchema);
