/**
 * سكريبت لإنشاء مستخدم تجريبي / مشرف
 * تشغيل: node scripts/create-admin-user.js
 */

require('dotenv').config();
const db = require('../src/config/database');
const User = require('../src/models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
  try {
    console.log('🌙 مرحباً بك في نظام نبراس المؤمنين\n');
    console.log('📝 إنشاء مستخدم جديد\n');

    // الاتصال بقاعدة البيانات
    db.connect();
    console.log('✅ متصل بقاعدة البيانات\n');

    // جمع البيانات
    const name = await question('الاسم: ');
    const phone = await question('رقم الواتساب (مع كود الدولة، مثال: +201234567890): ');

    console.log('\nالمستوى الديني:');
    console.log('1. مبتدئ');
    console.log('2. متوسط');
    console.log('3. متقدم');
    const levelChoice = await question('اختر (1-3): ');

    const levels = ['مبتدئ', 'متوسط', 'متقدم'];
    const level = levels[parseInt(levelChoice) - 1] || 'متوسط';

    const city = await question('المدينة (default: Cairo): ') || 'Cairo';
    const country = await question('الدولة (default: Egypt): ') || 'Egypt';

    console.log('\n🎯 الأهداف (اضغط Enter بدون كتابة للانتهاء):');
    const goals = [];
    let goal;
    let i = 1;
    while (true) {
      goal = await question(`  هدف ${i}: `);
      if (!goal) break;
      goals.push(goal);
      i++;
    }

    // إنشاء المستخدم
    console.log('\n💾 جاري الحفظ...');

    const user = User.create({
      name,
      phone,
      status: 'active',
      profile: {
        level,
        goals: goals.length > 0 ? goals : ['المحافظة على الصلوات'],
        preferredLearningStyle: 'رسائل قصيرة'
      },
      location: {
        city,
        country,
        timezone: 'Africa/Cairo'
      },
      routine: {
        wakeUpTime: '05:00',
        sleepTime: '23:00',
        workHours: {
          start: '09:00',
          end: '17:00'
        }
      },
      settings: {
        remindersBefore: 15,
        dailyContent: true,
        weeklyReport: true
      }
    });

    console.log('\n✅ تم إنشاء المستخدم بنجاح!\n');

    console.log('📋 معلومات المستخدم:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`الاسم: ${user.name}`);
    console.log(`الهاتف: ${user.phone}`);
    console.log(`المستوى: ${user.profile.level}`);
    console.log(`المدينة: ${user.location.city}, ${user.location.country}`);
    console.log(`الأهداف: ${user.profile.goals.join(', ')}`);
    console.log(`المعرف: ${user.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 ملاحظة: تأكد من تشغيل بوت الواتساب لاستقبال الرسائل\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// تشغيل
if (require.main === module) {
  createUser();
}

module.exports = createUser;
