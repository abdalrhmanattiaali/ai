// تحميل المتغيرات البيئية من مجلد backend
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize, User, Family } = require('../models/mysql');

// بيانات المستخدم الافتراضي
const DEFAULT_USER = {
  username: process.env.ADMIN_USERNAME || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@rafeeq.app',
  password: process.env.ADMIN_PASSWORD || '123456',
  role: 'admin'
};

// بيانات أسرة تجريبية
const DEFAULT_FAMILY = {
  familyName: 'أسرة تجريبية',
  location: {
    city: 'القاهرة',
    country: 'مصر'
  }
};

async function seedDatabaseMySQL() {
  try {
    console.log('🌱 Starting MySQL database seeding...');

    // التحقق من إعدادات قاعدة البيانات
    if (!process.env.DB_HOST || !process.env.DB_NAME) {
      console.log('⚠️  Database configuration not found in .env');
      console.log('💡 Please run the setup wizard first: http://localhost:3000/setup');
      process.exit(1);
    }

    console.log(`📍 MySQL Database: ${process.env.DB_NAME}`);
    console.log(`📍 MySQL Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);

    // الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ MySQL connection established');

    // مزامنة الجداول
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized');

    // التحقق إذا كان هناك مستخدمين
    const userCount = await User.count();

    if (userCount > 0) {
      console.log('ℹ️  Database already seeded. Skipping...');

      // عرض بيانات الدخول من .env
      if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
        console.log('\n📝 Login with:');
        console.log(`   Username: ${process.env.ADMIN_USERNAME}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);
      }

      process.exit(0);
    }

    // إنشاء المستخدم الافتراضي
    console.log('👤 Creating default admin user...');
    const user = await User.create(DEFAULT_USER);
    console.log('✅ Default user created:');
    console.log(`   Username: ${DEFAULT_USER.username}`);
    console.log(`   Email: ${DEFAULT_USER.email}`);
    console.log(`   Password: ${DEFAULT_USER.password}`);

    // إنشاء أسرة تجريبية
    console.log('\n👨‍👩‍👧‍👦 Creating default family...');
    const family = await Family.create({
      ...DEFAULT_FAMILY,
      userId: user.id
    });
    console.log('✅ Default family created');

    console.log('\n🎉 MySQL database seeding completed successfully!');
    console.log('\n📝 You can now login with:');
    console.log(`   URL: http://localhost:3000/login`);
    console.log(`   Username: ${DEFAULT_USER.username}`);
    console.log(`   Password: ${DEFAULT_USER.password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding MySQL database:', error.message);

    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 تأكد من:');
      console.error('   1. MySQL يعمل: sudo systemctl start mysql');
      console.error('   2. بيانات الاتصال صحيحة في .env');
      console.error('   3. المستخدم له صلاحيات الوصول');
    } else if (error.message.includes('Access denied')) {
      console.error('\n💡 خطأ في اسم المستخدم أو كلمة المرور');
      console.error('   تحقق من DB_USER و DB_PASSWORD في .env');
    } else if (error.message.includes('Unknown database')) {
      console.error('\n💡 قاعدة البيانات غير موجودة');
      console.error('   أنشئ قاعدة البيانات أولاً:');
      console.error(`   CREATE DATABASE ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }

    console.error('\n📚 للمساعدة: راجع INSTALLATION.md');
    process.exit(1);
  }
}

// تشغيل عند استدعاء الملف مباشرة
if (require.main === module) {
  seedDatabaseMySQL();
}

module.exports = seedDatabaseMySQL;
