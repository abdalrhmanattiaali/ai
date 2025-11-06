const mongoose = require('mongoose');

const memoryContextSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child'
  },

  contextKey: {
    type: String,
    required: true,
    index: true
  },

  contextType: {
    type: String,
    enum: ['preference', 'history', 'learning', 'interaction', 'feedback', 'pattern', 'other'],
    required: true
  },

  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  metadata: {
    source: {
      type: String,
      enum: ['conversation', 'explicit_input', 'ai_inference', 'system'],
      default: 'system'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    timesReferenced: {
      type: Number,
      default: 0
    },
    lastAccessed: Date,
    importance: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },

  tags: [String],

  expiresAt: Date, // optional - للبيانات المؤقتة

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
memoryContextSchema.index({ familyId: 1, contextKey: 1 });
memoryContextSchema.index({ familyId: 1, contextType: 1 });
memoryContextSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method لتحديث آخر استخدام
memoryContextSchema.methods.recordAccess = async function() {
  this.metadata.timesReferenced++;
  this.metadata.lastAccessed = new Date();
  await this.save();
};

module.exports = mongoose.model('MemoryContext', memoryContextSchema);
