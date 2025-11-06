const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/sequelize.config');

const Family = sequelize.define('Family', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },

  familyName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'يرجى إدخال اسم الأسرة'
      }
    }
  },

  location: {
    type: DataTypes.JSON,
    defaultValue: {
      city: 'القاهرة',
      country: 'مصر',
      coordinates: {
        lat: null,
        lon: null
      }
    }
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },

  subscription: {
    type: DataTypes.JSON,
    defaultValue: {
      plan: 'free',
      startDate: new Date(),
      endDate: null,
      autoRenew: false
    }
  },

  notifications: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      preferredLanguage: 'ar',
      timezone: 'Africa/Cairo',
      quietHours: {
        enabled: false,
        from: '22:00',
        to: '07:00'
      }
    }
  },

  statistics: {
    type: DataTypes.JSON,
    defaultValue: {
      totalMessages: 0,
      totalRecommendations: 0,
      completedActivities: 0,
      lastActivityDate: null
    }
  }
}, {
  tableName: 'families',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    {
      fields: ['userId']
    }
  ]
});

module.exports = Family;
