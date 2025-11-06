const { Sequelize } = require('sequelize');
const path = require('path');

// تحميل المتغيرات البيئية
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'sqlite';

let sequelize;

// إعداد Sequelize حسب نوع قاعدة البيانات
if (dbType === 'sqlite') {
  // SQLite - قاعدة بيانات ملف محلي (الأسهل!)
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: false
    }
  });

  console.log(`📁 SQLite Database: ${dbPath}`);

} else if (dbType === 'mysql') {
  // MySQL - قاعدة بيانات تقليدية
  sequelize = new Sequelize(
    process.env.DB_NAME || 'child_growth_system',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
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

  console.log(`🗄️  MySQL Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);

} else {
  throw new Error(`Unsupported database type: ${dbType}`);
}

// اختبار الاتصال
const connectSequelize = async () => {
  try {
    await sequelize.authenticate();

    if (dbType === 'sqlite') {
      console.log('✅ SQLite Connected successfully');
    } else if (dbType === 'mysql') {
      console.log('✅ MySQL Connected successfully');
    }

    // Sync database (create tables if not exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');

    return sequelize;
  } catch (error) {
    console.error(`❌ Unable to connect to ${dbType.toUpperCase()}:`, error.message);

    // رسائل تشخيصية
    if (dbType === 'mysql') {
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
    } else if (dbType === 'sqlite') {
      console.error('\n💡 تأكد من صلاحيات الكتابة على المجلد');
      console.error(`   المسار: ${process.env.DB_PATH || 'database.sqlite'}`);
    }

    throw error;
  }
};

module.exports = { sequelize, connectSequelize };
