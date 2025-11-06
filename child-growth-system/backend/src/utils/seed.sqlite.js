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

async function seedDatabaseSQLite() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
  console.log('🌱 Starting SQLite database seeding...');
  console.log(`📁 SQLite Database: ${dbPath}`);

  // الاتصال بقاعدة البيانات
  await sequelize.authenticate();
  console.log('✅ SQLite connection established');

  // مزامنة الجداول (تنشأ تلقائياً إذا لم تكن موجودة)
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

    // Return instead of exit when called from API
    if (require.main !== module) {
      return { success: true, message: 'Database already initialized' };
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

  console.log('\n🎉 SQLite database seeding completed successfully!');
  console.log('\n📝 You can now login with:');
  console.log(`   URL: http://localhost:3000/login`);
  console.log(`   Username: ${DEFAULT_USER.username}`);
  console.log(`   Password: ${DEFAULT_USER.password}`);
  console.log(`\n📁 Database file: ${dbPath}`);

  // Return instead of exit when called from API
  if (require.main !== module) {
    return {
      success: true,
      message: 'Database initialized successfully',
      username: DEFAULT_USER.username,
      password: DEFAULT_USER.password
    };
  }
  process.exit(0);
}

// Wrapper with error handling
async function seedDatabaseSQLiteWrapper() {
  try {
    return await seedDatabaseSQLite();
  } catch (error) {
    console.error('❌ Error seeding SQLite database:', error.message);

    if (require.main === module) {
      console.error('\n📚 للمساعدة: راجع INSTALLATION.md');
      process.exit(1);
    } else {
      throw error;
    }
  }
}

// تشغيل عند استدعاء الملف مباشرة
if (require.main === module) {
  seedDatabaseSQLiteWrapper();
}

module.exports = seedDatabaseSQLiteWrapper;
