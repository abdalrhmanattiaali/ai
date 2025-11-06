const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  // البيانات الأساسية
  fullName: {
    type: String,
    required: [true, 'يرجى إدخال الاسم الكامل'],
    trim: true
  },

  nickname: {
    type: String,
    trim: true
  },

  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'يرجى تحديد الجنس']
  },

  birthDate: {
    type: Date,
    required: [true, 'يرجى إدخال تاريخ الميلاد']
  },

  profileImage: {
    type: String,
    default: null
  },

  // البيانات الجسدية
  currentWeight: {
    type: Number, // بالكيلوجرام
    min: 0
  },

  currentHeight: {
    type: Number, // بالسنتيمتر
    min: 0
  },

  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown'
  },

  // الاهتمامات والهوايات
  interests: [{
    type: String
  }],

  favoriteActivities: [{
    type: String
  }],

  favoriteColors: [{
    type: String
  }],

  favoriteFoods: [{
    type: String
  }],

  // الحالة الصحية
  healthInfo: {
    allergies: [{
      type: String
    }],
    chronicConditions: [{
      type: String
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }],
    vaccinations: [{
      name: String,
      date: Date,
      nextDue: Date,
      notes: String
    }]
  },

  // مستوى التطور
  development: {
    motor: {
      type: String,
      enum: ['متقدم', 'طبيعي', 'يحتاج دعم', 'غير محدد'],
      default: 'غير محدد'
    },
    language: {
      type: String,
      enum: ['متقدم', 'طبيعي', 'يحتاج دعم', 'غير محدد'],
      default: 'غير محدد'
    },
    social: {
      type: String,
      enum: ['متقدم', 'طبيعي', 'يحتاج دعم', 'غير محدد'],
      default: 'غير محدد'
    },
    cognitive: {
      type: String,
      enum: ['متقدم', 'طبيعي', 'يحتاج دعم', 'غير محدد'],
      default: 'غير محدد'
    },
    emotional: {
      type: String,
      enum: ['متقدم', 'طبيعي', 'يحتاج دعم', 'غير محدد'],
      default: 'غير محدد'
    }
  },

  // الإنجازات
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    achievedDate: {
      type: Date,
      default: Date.now
    },
    ageAtAchievement: String, // مثل "2 سنة و 3 شهور"
    category: {
      type: String,
      enum: ['motor', 'language', 'social', 'cognitive', 'emotional', 'other']
    },
    notes: String
  }],

  // ملاحظات عامة
  notes: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual للعمر المحسوب
childSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;

  const now = new Date();
  const birth = new Date(this.birthDate);

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return {
    years,
    months,
    days,
    totalMonths: years * 12 + months
  };
});

// Index للبحث السريع
childSchema.index({ familyId: 1, fullName: 1 });
childSchema.index({ birthDate: 1 });

module.exports = mongoose.model('Child', childSchema);
