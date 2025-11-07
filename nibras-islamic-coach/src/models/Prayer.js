const mongoose = require('mongoose');

const PrayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // نوع الصلاة
  prayer: {
    type: String,
    enum: ['فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء'],
    required: true
  },

  // التاريخ والوقت
  date: {
    type: Date,
    required: true,
    index: true
  },
  hijriDate: {
    day: Number,
    month: String,
    year: Number
  },

  // حالة الصلاة
  status: {
    type: String,
    enum: ['في الوقت', 'متأخر', 'قضاء', 'فائت'],
    required: true
  },

  // مكان الصلاة
  inMasjid: {
    type: Boolean,
    default: false
  },
  withJamaa: {
    type: Boolean,
    default: false
  },

  // السنن الراتبة
  sunnah: {
    before: {
      type: Boolean,
      default: false
    },
    after: {
      type: Boolean,
      default: false
    }
  },

  // النوافل
  nafl: {
    duha: Boolean,        // الضحى
    witr: Boolean,        // الوتر
    tahajjud: Boolean,    // التهجد
    qiyam: Boolean        // قيام الليل
  },

  // النقاط المكتسبة
  points: {
    type: Number,
    default: 0
  },

  // وقت التسجيل
  recordedAt: {
    type: Date,
    default: Date.now
  },

  // ملاحظات
  notes: String
});

// Index مركب للبحث السريع
PrayerSchema.index({ userId: 1, date: -1 });
PrayerSchema.index({ userId: 1, prayer: 1, date: -1 });

// حساب النقاط قبل الحفظ
PrayerSchema.pre('save', function(next) {
  let points = 0;

  // النقاط الأساسية
  switch(this.status) {
    case 'في الوقت':
      points = 10;
      break;
    case 'متأخر':
      points = 7;
      break;
    case 'قضاء':
      points = 5;
      break;
    case 'فائت':
      points = -15;
      break;
  }

  // نقاط إضافية
  if (this.inMasjid) points += 10;
  if (this.withJamaa) points += 5;
  if (this.sunnah.before) points += 3;
  if (this.sunnah.after) points += 3;

  // نقاط النوافل
  if (this.nafl.duha) points += 8;
  if (this.nafl.witr) points += 10;
  if (this.nafl.tahajjud) points += 50;
  if (this.nafl.qiyam) points += 25;

  this.points = points;
  next();
});

// Static Methods
PrayerSchema.statics = {
  // إحصائيات المستخدم لفترة معينة
  getUserStats: async function(userId, startDate, endDate) {
    return this.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: '$prayer',
          total: { $sum: 1 },
          onTime: {
            $sum: { $cond: [{ $eq: ['$status', 'في الوقت'] }, 1, 0] }
          },
          missed: {
            $sum: { $cond: [{ $eq: ['$status', 'فائت'] }, 1, 0] }
          },
          totalPoints: { $sum: '$points' }
        }
      }
    ]);
  },

  // الصلوات اليوم
  getTodayPrayers: async function(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.find({
      userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ date: 1 });
  },

  // أفضل أسبوع
  getBestWeek: async function(userId) {
    const prayers = await this.find({ userId })
      .sort({ date: -1 })
      .limit(35); // 7 أيام × 5 صلوات

    let bestWeek = 0;
    let currentWeek = 0;

    prayers.forEach(prayer => {
      if (prayer.status !== 'فائت') {
        currentWeek++;
      } else {
        if (currentWeek > bestWeek) bestWeek = currentWeek;
        currentWeek = 0;
      }
    });

    return Math.max(bestWeek, currentWeek);
  }
};

module.exports = mongoose.model('Prayer', PrayerSchema);
