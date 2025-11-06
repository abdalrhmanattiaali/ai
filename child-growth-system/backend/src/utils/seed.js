// تحميل المتغيرات البيئية من مجلد backend
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');
const connectDB = require('../config/database');

// بيانات المستخدم الافتراضي
const DEFAULT_USER = {
  username: 'admin',
  email: 'admin@rafeeq.app',
  password: '123456',
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

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // التأكد من وجود MONGODB_URI
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not found in .env, using default...');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/child-growth-system';
    }

    console.log(`📍 MongoDB URI: ${process.env.MONGODB_URI}`);

    // الاتصال بقاعدة البيانات
    await connectDB();

    // التحقق إذا كان هناك مستخدمين
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      console.log('ℹ️  Database already seeded. Skipping...');
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
      userId: user._id
    });
    console.log('✅ Default family created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 You can now login with:');
    console.log(`   URL: http://localhost:3000/login`);
    console.log(`   Username: ${DEFAULT_USER.username}`);
    console.log(`   Password: ${DEFAULT_USER.password}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);

    if (error.message.includes('connect')) {
      console.error('\n💡 تأكد من تشغيل MongoDB:');
      console.error('   - محلي: sudo systemctl start mongod');
      console.error('   - Docker: docker run -d -p 27017:27017 --name mongodb mongo');
      console.error('   - أو استخدم MongoDB Atlas (Cloud)');
      console.error('\n📚 راجع دليل التثبيت: MONGODB-INSTALL.md');
    }

    process.exit(1);
  }
}

// تشغيل عند استدعاء الملف مباشرة
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
