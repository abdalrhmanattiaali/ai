const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'inactive'],
    default: 'active'
  },

  // الملف الشخصي الديني
  profile: {
    level: {
      type: String,
      enum: ['مبتدئ', 'متوسط', 'متقدم'],
      default: 'متوسط'
    },
    goals: [{
      type: String,
      // مثال: "المحافظة على الفجر", "ختم القرآن شهرياً"
    }],
    weakPoints: [{
      type: String,
      // مثال: "صلاة الفجر", "الأذكار"
    }],
    preferredLearningStyle: {
      type: String,
      enum: ['رسائل قصيرة', 'رسائل مفصلة', 'صوتيات'],
      default: 'رسائل قصيرة'
    }
  },

  // الروتين المخصص
  routine: {
    wakeUpTime: {
      type: String,
      default: '05:00'
    },
    sleepTime: {
      type: String,
      default: '23:00'
    },
    workHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    freeTime: [{
      type: String,
      // مثال: "13:00-14:00"
    }]
  },

  // الموقع (لأوقات الصلاة)
  location: {
    city: {
      type: String,
      default: 'Cairo'
    },
    country: {
      type: String,
      default: 'Egypt'
    },
    timezone: {
      type: String,
      default: 'Africa/Cairo'
    },
    latitude: Number,
    longitude: Number
  },

  // الإحصائيات
  stats: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    lastPrayerDate: Date,
    totalPrayers: {
      type: Number,
      default: 0
    },
    totalQuranPages: {
      type: Number,
      default: 0
    }
  },

  // الإعدادات
  settings: {
    remindersBefore: {
      type: Number,
      default: 15 // دقيقة قبل الأذان
    },
    remindersAfter: {
      type: Boolean,
      default: true
    },
    dailyContent: {
      type: Boolean,
      default: true
    },
    weeklyReport: {
      type: Boolean,
      default: true
    },
    groupMessages: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'ar'
    }
  },

  // الأوسمة والإنجازات
  badges: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],

  // تاريخ الانضمام
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware لتحديث updatedAt
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
UserSchema.methods = {
  // إضافة نقاط
  addPoints: function(points) {
    this.stats.totalPoints += points;
    this.updateLevel();
    return this.save();
  },

  // تحديث المستوى
  updateLevel: function() {
    const points = this.stats.totalPoints;
    if (points >= 5000) this.stats.level = 5;
    else if (points >= 2000) this.stats.level = 4;
    else if (points >= 1000) this.stats.level = 3;
    else if (points >= 500) this.stats.level = 2;
    else this.stats.level = 1;
  },

  // تحديث الشريط (Streak)
  updateStreak: function(date) {
    const today = new Date(date);
    const lastPrayer = this.stats.lastPrayerDate;

    if (!lastPrayer) {
      this.stats.currentStreak = 1;
    } else {
      const diffDays = Math.floor((today - lastPrayer) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // يوم متتالي
        this.stats.currentStreak += 1;
      } else if (diffDays > 1) {
        // انقطع الشريط
        this.stats.currentStreak = 1;
      }
      // إذا كان نفس اليوم، لا تغيير
    }

    // تحديث أطول شريط
    if (this.stats.currentStreak > this.stats.longestStreak) {
      this.stats.longestStreak = this.stats.currentStreak;
    }

    this.stats.lastPrayerDate = today;
    return this.save();
  },

  // إضافة وسام
  addBadge: function(name, description, icon) {
    const exists = this.badges.find(b => b.name === name);
    if (!exists) {
      this.badges.push({
        name,
        description,
        icon,
        earnedAt: new Date()
      });
      return this.save();
    }
    return Promise.resolve(this);
  }
};

module.exports = mongoose.model('User', UserSchema);
