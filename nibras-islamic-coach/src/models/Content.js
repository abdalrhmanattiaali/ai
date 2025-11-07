const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  // نوع المحتوى
  type: {
    type: String,
    enum: ['درس', 'دعاء', 'ذكر', 'آية', 'حديث', 'فائدة', 'قصة'],
    required: true
  },

  // العنوان
  title: {
    type: String,
    required: true,
    trim: true
  },

  // المحتوى
  content: {
    type: String,
    required: true
  },

  // المحتوى القصير (للرسائل)
  shortContent: String,

  // المستوى
  level: {
    type: String,
    enum: ['مبتدئ', 'متوسط', 'متقدم', 'الكل'],
    default: 'الكل'
  },

  // التصنيفات
  category: {
    type: String,
    enum: ['عقيدة', 'فقه', 'سيرة', 'أخلاق', 'عبادات', 'معاملات', 'آداب'],
    default: 'عبادات'
  },

  // الوسوم
  tags: [{
    type: String,
    trim: true
  }],

  // الجدولة
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    time: String,           // "07:00"
    frequency: {
      type: String,
      enum: ['يومي', 'أسبوعي', 'شهري', 'مناسبة'],
      default: 'يومي'
    },
    days: [Number],         // [0, 1, 2, 3, 4, 5, 6] - الأحد=0
    occasions: [String],    // ["رمضان", "جمعة", "عشر ذي الحجة"]
  },

  // المصدر
  source: {
    type: String,
    trim: true
  },
  reference: String,

  // الإحصائيات
  stats: {
    sent: {
      type: Number,
      default: 0
    },
    read: {
      type: Number,
      default: 0
    },
    liked: {
      type: Number,
      default: 0
    }
  },

  // الحالة
  status: {
    type: String,
    enum: ['نشط', 'معطل', 'مسودة'],
    default: 'نشط'
  },

  // تاريخ الإنشاء
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ContentSchema.index({ type: 1, level: 1 });
ContentSchema.index({ 'schedule.occasions': 1 });
ContentSchema.index({ tags: 1 });

// Static Methods
ContentSchema.statics = {
  // الحصول على محتوى مناسب
  getSuitableContent: async function(type, level = 'الكل', occasion = null) {
    const query = {
      type,
      status: 'نشط',
      $or: [
        { level },
        { level: 'الكل' }
      ]
    };

    if (occasion) {
      query['schedule.occasions'] = occasion;
    }

    return this.findOne(query).sort({ 'stats.sent': 1 }); // الأقل إرسالاً
  },

  // محتوى عشوائي
  getRandomContent: async function(type, level = 'الكل') {
    const count = await this.countDocuments({
      type,
      status: 'نشط',
      $or: [{ level }, { level: 'الكل' }]
    });

    if (count === 0) return null;

    const random = Math.floor(Math.random() * count);
    return this.findOne({
      type,
      status: 'نشط',
      $or: [{ level }, { level: 'الكل' }]
    }).skip(random);
  },

  // تسجيل إرسال
  recordSent: async function(contentId) {
    return this.findByIdAndUpdate(
      contentId,
      { $inc: { 'stats.sent': 1 } }
    );
  }
};

module.exports = mongoose.model('Content', ContentSchema);
