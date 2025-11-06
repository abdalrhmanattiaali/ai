const { Sequelize } = require('sequelize');

// تحميل المتغيرات البيئية
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'child_growth_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_TYPE || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false
    }
  }
);

// اختبار الاتصال
const connectSequelize = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully');

    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database synchronized');
    }

    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);

    // رسائل تشخيصية
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 تأكد من:');
      console.error('   1. MySQL يعمل: sudo systemctl start mysql');
      console.error('   2. بيانات الاتصال صحيحة في .env');
      console.error('   3. قاعدة البيانات موجودة');
    } else if (error.message.includes('Access denied')) {
      console.error('\n💡 خطأ في اسم المستخدم أو كلمة المرور');
      console.error('   تحقق من DB_USER و DB_PASSWORD في .env');
    } else if (error.message.includes('Unknown database')) {
      console.error('\n💡 قاعدة البيانات غير موجودة');
      console.error('   أنشئ قاعدة البيانات أولاً:');
      console.error('   CREATE DATABASE child_growth_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    }

    throw error;
  }
};

module.exports = { sequelize, connectSequelize };
