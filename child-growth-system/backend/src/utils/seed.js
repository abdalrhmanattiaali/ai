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
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// تشغيل عند استدعاء الملف مباشرة
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
