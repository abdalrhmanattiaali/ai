const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },

  recordDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  ageAtRecord: {
    years: Number,
    months: Number,
    days: Number,
    totalMonths: Number
  },

  measurements: {
    weight: {
      type: Number, // كجم
      required: true,
      min: 0
    },
    height: {
      type: Number, // سم
      required: true,
      min: 0
    },
    headCircumference: {
      type: Number, // سم (للرضع)
      min: 0
    },
    bmi: Number // محسوب تلقائياً
  },

  percentiles: {
    weightPercentile: Number,
    heightPercentile: Number,
    bmiPercentile: Number,
    headCircumferencePercentile: Number
  },

  notes: String,

  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }
}, {
  timestamps: true
});

// حساب BMI قبل الحفظ
growthRecordSchema.pre('save', function(next) {
  if (this.measurements.weight && this.measurements.height) {
    const heightInMeters = this.measurements.height / 100;
    this.measurements.bmi = parseFloat(
      (this.measurements.weight / (heightInMeters * heightInMeters)).toFixed(2)
    );
  }
  next();
});

// Indexes
growthRecordSchema.index({ childId: 1, recordDate: -1 });

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);
