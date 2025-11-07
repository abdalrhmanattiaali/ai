const mongoose = require('mongoose');

const QuranSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // التاريخ
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  hijriDate: {
    day: Number,
    month: String,
    year: Number
  },

  // القراءة
  pages: {
    type: Number,
    default: 0
  },
  from: {
    surah: String,
    ayah: Number,
    page: Number,
    juz: Number
  },
  to: {
    surah: String,
    ayah: Number,
    page: Number,
    juz: Number
  },

  // المدة (بالدقائق)
  duration: {
    type: Number,
    default: 0
  },

  // نوع القراءة
  type: {
    type: String,
    enum: ['ورد يومي', 'ختمة', 'تدبر', 'حفظ', 'مراجعة'],
    default: 'ورد يومي'
  },

  // التلاوة بالصوت
  withRecitation: {
    type: Boolean,
    default: false
  },

  // مع التفسير
  withTafsir: {
    type: Boolean,
    default: false
  },

  // النقاط
  points: {
    type: Number,
    default: 0
  },

  // ملاحظات
  notes: String,

  // وقت التسجيل
  recordedAt: {
    type: Date,
    default: Date.now
  }
});

// حساب النقاط قبل الحفظ
QuranSchema.pre('save', function(next) {
  let points = this.pages * 2; // 2 نقطة لكل صفحة

  if (this.type === 'حفظ') points *= 3;
  if (this.type === 'تدبر') points *= 1.5;
  if (this.withTafsir) points += 5;
  if (this.withRecitation) points += 3;

  // مكافأة القراءة الطويلة
  if (this.pages >= 20) points += 20; // جزء كامل
  if (this.pages >= 40) points += 50; // حزب كامل

  this.points = Math.round(points);
  next();
});

// Static Methods
QuranSchema.statics = {
  // إحصائيات القرآن للمستخدم
  getUserQuranStats: async function(userId, startDate, endDate) {
    const stats = await this.aggregate([
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
          _id: null,
          totalPages: { $sum: '$pages' },
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalPoints: { $sum: '$points' },
          avgPages: { $avg: '$pages' }
        }
      }
    ]);

    return stats[0] || {
      totalPages: 0,
      totalSessions: 0,
      totalDuration: 0,
      totalPoints: 0,
      avgPages: 0
    };
  },

  // التقدم في الختمة الحالية
  getCurrentKhatmahProgress: async function(userId) {
    const readings = await this.find({ userId, type: 'ختمة' })
      .sort({ date: -1 });

    let totalPages = 0;
    for (let reading of readings) {
      totalPages += reading.pages;
      if (totalPages >= 604) break; // عدد صفحات المصحف
    }

    return {
      pagesRead: totalPages % 604,
      percentage: ((totalPages % 604) / 604 * 100).toFixed(2),
      isComplete: totalPages >= 604
    };
  },

  // عدد الختمات
  getTotalKhatmahs: async function(userId) {
    const total = await this.aggregate([
      {
        $match: { userId: mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalPages: { $sum: '$pages' }
        }
      }
    ]);

    const totalPages = total[0]?.totalPages || 0;
    return Math.floor(totalPages / 604);
  }
};

module.exports = mongoose.model('Quran', QuranSchema);
