const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'يرجى إدخال اسم المستخدم'],
    unique: true,
    trim: true,
    minlength: [3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل']
  },

  email: {
    type: String,
    required: [true, 'يرجى إدخال البريد الإلكتروني'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'البريد الإلكتروني غير صالح'
    ]
  },

  password: {
    type: String,
    required: [true, 'يرجى إدخال كلمة المرور'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
    select: false // لا يتم إرجاعها في الاستعلامات
  },

  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },

  settings: {
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    timezone: {
      type: String,
      default: 'Africa/Cairo'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  },

  lastLogin: {
    type: Date
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// مقارنة كلمة المرور
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// توليد JWT Token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', userSchema);
