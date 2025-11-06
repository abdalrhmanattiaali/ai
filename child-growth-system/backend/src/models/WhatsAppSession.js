const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  sessionName: {
    type: String,
    default: 'main-session'
  },

  isConnected: {
    type: Boolean,
    default: false
  },

  qrCode: {
    type: String, // base64 string
    default: null
  },

  phoneNumber: {
    type: String, // رقم الواتساب المربوط
    default: null
  },

  clientInfo: {
    platform: String,
    deviceName: String,
    waVersion: String,
    pushname: String,
    me: String
  },

  connectionStatus: {
    type: String,
    enum: ['pending', 'qr', 'connected', 'disconnected', 'error'],
    default: 'pending'
  },

  connectionAttempts: {
    type: Number,
    default: 0
  },

  lastQRCodeGeneratedAt: Date,

  lastConnected: Date,

  lastDisconnected: Date,

  disconnectReason: String,

  errorLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    error: String,
    stack: String
  }],

  statistics: {
    totalMessagesSent: {
      type: Number,
      default: 0
    },
    totalMessagesReceived: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number,
      default: 0 // بالدقائق
    }
  }
}, {
  timestamps: true
});

// Method لتحديث حالة الاتصال
whatsappSessionSchema.methods.updateConnectionStatus = async function(status, additionalData = {}) {
  this.connectionStatus = status;

  if (status === 'connected') {
    this.isConnected = true;
    this.lastConnected = new Date();
    if (additionalData.clientInfo) {
      this.clientInfo = additionalData.clientInfo;
    }
    if (additionalData.phoneNumber) {
      this.phoneNumber = additionalData.phoneNumber;
    }
  } else if (status === 'disconnected') {
    this.isConnected = false;
    this.lastDisconnected = new Date();
    if (additionalData.reason) {
      this.disconnectReason = additionalData.reason;
    }
  } else if (status === 'qr') {
    this.qrCode = additionalData.qrCode || null;
    this.lastQRCodeGeneratedAt = new Date();
    this.connectionAttempts++;
  }

  await this.save();
};

// Method لإضافة خطأ
whatsappSessionSchema.methods.addError = async function(error, stack) {
  this.errorLog.push({
    error: error.toString(),
    stack: stack || null
  });

  // حفظ آخر 50 خطأ فقط
  if (this.errorLog.length > 50) {
    this.errorLog = this.errorLog.slice(-50);
  }

  await this.save();
};

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);
