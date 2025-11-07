/**
 * سكريبت لملء قاعدة البيانات بمحتوى إسلامي أولي
 * تشغيل: node scripts/seed-content.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('../src/models/Content');

const islamicContent = [
  // آيات قرآنية
  {
    type: 'آية',
    title: 'آية الكرسي',
    content: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ...',
    shortContent: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    level: 'الكل',
    category: 'عقيدة',
    tags: ['آية الكرسي', 'حفظ', 'بركة'],
    source: 'سورة البقرة - آية 255',
    status: 'نشط'
  },
  {
    type: 'آية',
    title: 'آية الصيام',
    content: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ',
    level: 'الكل',
    category: 'عبادات',
    tags: ['صيام', 'رمضان', 'تقوى'],
    source: 'سورة البقرة - آية 183',
    schedule: {
      occasions: ['رمضان']
    },
    status: 'نشط'
  },

  // أحاديث
  {
    type: 'حديث',
    title: 'فضل الصلوات الخمس',
    content: 'ما من امرئ مسلم تحضره صلاة مكتوبة فيحسن وضوءها وخشوعها وركوعها إلا كانت كفارة لما قبلها من الذنوب ما لم يؤت كبيرة، وذلك الدهر كله',
    level: 'الكل',
    category: 'عبادات',
    tags: ['صلاة', 'فضائل'],
    source: 'رواه مسلم',
    status: 'نشط'
  },
  {
    type: 'حديث',
    title: 'أحب الأعمال إلى الله',
    content: 'أحب الأعمال إلى الله أدومها وإن قل',
    shortContent: 'أحب الأعمال إلى الله أدومها وإن قل',
    level: 'الكل',
    category: 'أخلاق',
    tags: ['استمرارية', 'دوام'],
    source: 'متفق عليه',
    status: 'نشط'
  },

  // أدعية
  {
    type: 'دعاء',
    title: 'دعاء الصباح',
    content: 'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور',
    level: 'الكل',
    category: 'أذكار',
    tags: ['صباح', 'أذكار'],
    schedule: {
      enabled: true,
      time: '07:00',
      frequency: 'يومي'
    },
    status: 'نشط'
  },
  {
    type: 'دعاء',
    title: 'دعاء المساء',
    content: 'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير',
    level: 'الكل',
    category: 'أذكار',
    tags: ['مساء', 'أذكار'],
    schedule: {
      enabled: true,
      time: '18:00',
      frequency: 'يومي'
    },
    status: 'نشط'
  },
  {
    type: 'دعاء',
    title: 'دعاء قبل النوم',
    content: 'اللهم باسمك أموت وأحيا',
    level: 'الكل',
    category: 'أذكار',
    tags: ['نوم', 'أذكار'],
    status: 'نشط'
  },

  // أذكار
  {
    type: 'ذكر',
    title: 'سبحان الله وبحمده',
    content: 'سبحان الله وبحمده، سبحان الله العظيم (100 مرة)\nفضلها: حطت خطاياه وإن كانت مثل زبد البحر',
    shortContent: 'سبحان الله وبحمده',
    level: 'الكل',
    category: 'أذكار',
    tags: ['تسبيح'],
    source: 'متفق عليه',
    status: 'نشط'
  },
  {
    type: 'ذكر',
    title: 'الاستغفار',
    content: 'أستغفر الله العظيم وأتوب إليه (100 مرة)',
    level: 'الكل',
    category: 'أذكار',
    tags: ['استغفار', 'توبة'],
    status: 'نشط'
  },

  // دروس
  {
    type: 'درس',
    title: 'أركان الإسلام الخمسة',
    content: `أركان الإسلام خمسة:

1. الشهادتان: أشهد أن لا إله إلا الله وأن محمداً رسول الله
2. إقام الصلاة: خمس صلوات في اليوم
3. إيتاء الزكاة: 2.5% من المال
4. صوم رمضان: صيام شهر رمضان
5. حج البيت: لمن استطاع إليه سبيلاً

الدليل: حديث جبريل عليه السلام`,
    level: 'مبتدئ',
    category: 'عقيدة',
    tags: ['أركان الإسلام', 'أساسيات'],
    status: 'نشط'
  },
  {
    type: 'درس',
    title: 'فضل الصلوات الخمس',
    content: `الصلوات الخمس كفارة للذنوب:

- الفجر: في ذمة الله حتى يمسي
- الظهر: وقت الغفلة، تذكير بالله
- العصر: الصلاة الوسطى
- المغرب: بعد يوم عمل طويل
- العشاء: آخر عبادة اليوم

قال تعالى: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا"`,
    level: 'متوسط',
    category: 'عبادات',
    tags: ['صلاة', 'فضائل'],
    status: 'نشط'
  },

  // فوائد
  {
    type: 'فائدة',
    title: 'لماذا الفجر صعب؟',
    content: 'صلاة الفجر هي الأصعب لأنها وقت راحة الجسد، لكنها الأعظم أجراً. من حافظ عليها فقد غلب شهوة النوم، وهي أول خطوة في تزكية النفس.',
    level: 'الكل',
    category: 'عبادات',
    tags: ['فجر', 'تحفيز'],
    status: 'نشط'
  },
  {
    type: 'فائدة',
    title: 'القرآن شفاء',
    content: 'القرآن شفاء للقلوب قبل الأبدان. اقرأه بتدبر ولو صفحة واحدة يومياً، وستجد راحة وطمأنينة ما بعدها راحة.',
    level: 'الكل',
    category: 'عبادات',
    tags: ['قرآن', 'شفاء'],
    status: 'نشط'
  }
];

async function seedContent() {
  try {
    console.log('🌱 بدء ملء قاعدة البيانات بالمحتوى الإسلامي...\n');

    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nibras_coach');
    console.log('✅ متصل بقاعدة البيانات\n');

    // حذف المحتوى القديم (اختياري)
    const deleteCount = await Content.deleteMany({});
    console.log(`🗑️  تم حذف ${deleteCount.deletedCount} محتوى قديم\n`);

    // إضافة المحتوى الجديد
    console.log('📝 إضافة المحتوى الجديد...\n');

    for (let item of islamicContent) {
      const content = new Content(item);
      await content.save();
      console.log(`✅ تم إضافة: ${item.title} (${item.type})`);
    }

    console.log(`\n✨ تم إضافة ${islamicContent.length} محتوى بنجاح!\n`);

    // عرض إحصائيات
    const stats = await Content.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    console.log('📊 الإحصائيات:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });

    console.log('\n🎉 انتهى الملء بنجاح!');

    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  seedContent();
}

module.exports = seedContent;
