const mongoose = require('mongoose');

const messageRecipientSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true
  },

  type: {
    type: String,
    enum: ['individual', 'group'],
    required: true
  },

  // للأفراد
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },

  phoneNumber: {
    type: String
  },

  // للمجموعات
  groupId: {
    type: String // WhatsApp Group ID
  },

  groupName: {
    type: String
  },

  groupMembers: [{
    number: String,
    name: String,
    role: String
  }],

  isActive: {
    type: Boolean,
    default: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  verifiedAt: Date,

  lastMessageSent: Date,

  statistics: {
    totalMessagesSent: {
      type: Number,
      default: 0
    },
    successfulSent: {
      type: Number,
      default: 0
    },
    failedSent: {
      type: Number,
      default: 0
    },
    deliveryRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Index
messageRecipientSchema.index({ familyId: 1, type: 1 });
messageRecipientSchema.index({ phoneNumber: 1 });
messageRecipientSchema.index({ groupId: 1 });

module.exports = mongoose.model('MessageRecipient', messageRecipientSchema);
