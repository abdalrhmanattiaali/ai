const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../config/sequelize.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'اسم المستخدم مستخدم بالفعل'
    },
    validate: {
      len: {
        args: [3, 100],
        msg: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'
      },
      notEmpty: {
        msg: 'يرجى إدخال اسم المستخدم'
      }
    }
  },

  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'البريد الإلكتروني مستخدم بالفعل'
    },
    validate: {
      isEmail: {
        msg: 'البريد الإلكتروني غير صالح'
      },
      notEmpty: {
        msg: 'يرجى إدخال البريد الإلكتروني'
      }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase());
    }
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      },
      notEmpty: {
        msg: 'يرجى إدخال كلمة المرور'
      }
    }
  },

  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    allowNull: false
  },

  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      language: 'ar',
      timezone: 'Africa/Cairo',
      theme: 'light'
    }
  },

  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    }
  ]
});

// Hash password قبل الحفظ
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance methods
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this.id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// إخفاء كلمة المرور عند التحويل لـ JSON
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
