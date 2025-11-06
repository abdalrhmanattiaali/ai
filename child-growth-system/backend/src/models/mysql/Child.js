const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize.config');

const Child = sequelize.define('Child', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  familyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'families',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },

  // البيانات الأساسية
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'يرجى إدخال الاسم الكامل'
      }
    }
  },

  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  gender: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'يرجى تحديد الجنس'
      }
    }
  },

  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'يرجى إدخال تاريخ الميلاد'
      },
      isDate: true
    }
  },

  profileImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },

  // البيانات الجسدية
  currentWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },

  currentHeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },

  bloodType: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
    defaultValue: 'unknown'
  },

  // الاهتمامات والهوايات (JSON arrays)
  interests: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  favoriteActivities: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  favoriteColors: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  favoriteFoods: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  // الحالة الصحية
  healthInfo: {
    type: DataTypes.JSON,
    defaultValue: {
      allergies: [],
      chronicConditions: [],
      medications: [],
      vaccinations: []
    }
  },

  // مستوى التطور
  development: {
    type: DataTypes.JSON,
    defaultValue: {
      motor: 'غير محدد',
      language: 'غير محدد',
      social: 'غير محدد',
      cognitive: 'غير محدد',
      emotional: 'غير محدد'
    }
  },

  // الإنجازات
  milestones: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  // ملاحظات عامة
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'children',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    {
      fields: ['familyId']
    },
    {
      fields: ['birthDate']
    },
    {
      fields: ['familyId', 'fullName']
    }
  ]
});

// Virtual للعمر المحسوب
Child.prototype.getAge = function() {
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
};

module.exports = Child;
