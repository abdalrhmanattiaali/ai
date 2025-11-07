const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const User = require('../../models/User');
const Prayer = require('../../models/Prayer');
const Quran = require('../../models/Quran');
const prayerTimesService = require('../prayerTimes');
const claudeAI = require('../ai/ClaudeService');
const chatGPT = require('../ai/ChatGPTService');
const cron = require('node-cron');
const moment = require('moment');

/**
 * بوت الواتساب الذكي
 * المسؤول عن:
 * - إرسال التذكيرات
 * - استقبال الردود
 * - التفاعل مع المستخدمين
 * - الرسائل الجماعية
 */
class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.messageHandlers = new Map();

    this._setupClient();
    this._setupMessageHandlers();
  }

  /**
   * إعداد عميل الواتساب
   */
  _setupClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this._setupEventHandlers();
  }

  /**
   * إعداد معالجات الأحداث
   */
  _setupEventHandlers() {
    // عند مسح QR Code
    this.client.on('qr', (qr) => {
      console.log('\n🔐 امسح الـ QR Code للاتصال بالواتساب:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n');
    });

    // عند الاتصال
    this.client.on('ready', () => {
      console.log('✅ بوت الواتساب جاهز!');
      this.isReady = true;
      this._startScheduledTasks();
    });

    // عند استلام رسالة
    this.client.on('message', async (msg) => {
      await this._handleIncomingMessage(msg);
    });

    // عند حدوث خطأ
    this.client.on('auth_failure', (error) => {
      console.error('❌ فشل المصادقة:', error);
    });

    this.client.on('disconnected', (reason) => {
      console.log('⚠️ انقطع الاتصال:', reason);
      this.isReady = false;
    });
  }

  /**
   * معالجة الرسائل الواردة
   */
  async _handleIncomingMessage(msg) {
    try {
      // تجاهل رسائل الجروبات (إلا إذا كانت mention)
      if (msg.from.includes('@g.us') && !msg.mentionedIds.includes(this.client.info.wid._serialized)) {
        return;
      }

      // استخراج رقم الهاتف
      const phone = msg.from.replace('@c.us', '');

      // البحث عن المستخدم
      const user = await User.findOne({ phone: { $regex: phone } });

      if (!user) {
        // مستخدم غير مسجل
        await msg.reply(
          '❌ عذراً، أنت غير مسجل في النظام.\n\n' +
          'للتسجيل، يرجى التواصل مع المشرف.'
        );
        return;
      }

      // تحقق من حالة المستخدم
      if (user.status !== 'active') {
        return; // مستخدم موقوف أو معطل
      }

      const text = msg.body.trim();

      // معالجة الأوامر
      await this._processCommand(msg, user, text);

    } catch (error) {
      console.error('Error handling message:', error);
      await msg.reply('❌ حدث خطأ، حاول مرة أخرى.');
    }
  }

  /**
   * معالجة الأوامر
   */
  async _processCommand(msg, user, text) {
    const lowerText = text.toLowerCase();

    // ردود الصلاة
    if (this._isPrayerResponse(text)) {
      await this._handlePrayerResponse(msg, user, text);
      return;
    }

    // الأوامر النصية
    if (lowerText === 'إحصائياتي' || lowerText === 'احصائيات' || lowerText === 'stats') {
      await this._sendUserStats(msg, user);
    }
    else if (lowerText === 'أوقات الصلاة' || lowerText === 'مواقيت' || lowerText === 'prayer times') {
      await this._sendPrayerTimes(msg, user);
    }
    else if (lowerText.startsWith('دعاء') || lowerText === 'duaa') {
      await this._sendDuaa(msg, user);
    }
    else if (lowerText.startsWith('ذكر') || lowerText === 'dhikr') {
      await this._sendDhikr(msg, user);
    }
    else if (lowerText.startsWith('آية') || lowerText === 'ayah') {
      await this._sendAyah(msg, user);
    }
    else if (lowerText.startsWith('حديث') || lowerText === 'hadith') {
      await this._sendHadith(msg, user);
    }
    else if (lowerText === 'قرآن' || lowerText.includes('quran')) {
      await this._handleQuranReading(msg, user);
    }
    else if (lowerText === 'مساعدة' || lowerText === 'help' || lowerText === 'الأوامر') {
      await this._sendHelp(msg, user);
    }
    else if (lowerText === 'تحليلي' || lowerText === 'analysis') {
      await this._sendAIAnalysis(msg, user);
    }
    else if (lowerText === 'نصيحة' || lowerText === 'advice') {
      await this._sendAIAdvice(msg, user);
    }
    else if (lowerText === 'روتين' || lowerText === 'routine') {
      await this._sendRoutine(msg, user);
    }
    else {
      // محادثة عامة مع الذكاء الاصطناعي
      await this._handleGeneralChat(msg, user, text);
    }
  }

  /**
   * التحقق من رد الصلاة
   */
  _isPrayerResponse(text) {
    const responses = [
      'صليت', 'نعم', 'yes', '✓', '✅',
      'قضاء', 'لاحقا', 'لاحقاً',
      'لا', 'no', 'فاتت', 'ما صليت'
    ];

    return responses.some(r => text.toLowerCase().includes(r));
  }

  /**
   * معالجة رد الصلاة
   */
  async _handlePrayerResponse(msg, user, text) {
    try {
      // تحديد آخر صلاة تم إرسال تذكير لها
      const times = await prayerTimesService.getToday(user.location);
      const currentPrayer = this._getCurrentPrayer(times.timings);

      let status = 'في الوقت';
      let message = '';

      if (text.includes('صليت') || text.includes('نعم') || text.includes('yes') || text.includes('✓')) {
        status = 'في الوقت';
        message = '✅ ما شاء الله تبارك الرحمن!\n';
      }
      else if (text.includes('قضاء') || text.includes('لاحق')) {
        status = 'قضاء';
        message = '⏰ لا بأس، لكن حاول صليها قريباً\n';
      }
      else if (text.includes('لا') || text.includes('no') || text.includes('فاتت')) {
        status = 'فائت';
        message = '😔 لا تحزن، صلها الآن قضاءً\n';
      }

      // تسجيل الصلاة
      const prayer = new Prayer({
        userId: user._id,
        prayer: currentPrayer.name,
        date: new Date(),
        status,
        hijriDate: times.hijriDate
      });

      await prayer.save();

      // تحديث نقاط المستخدم
      await user.addPoints(prayer.points);
      await user.updateStreak(new Date());

      // رسالة الرد
      message += `\n📊 النقاط: +${prayer.points}\n`;
      message += `💎 المجموع: ${user.stats.totalPoints}\n`;
      message += `🔥 الشريط: ${user.stats.currentStreak} يوم`;

      // رسالة تحفيزية إن وجدت
      if (user.stats.currentStreak % 7 === 0 && user.stats.currentStreak > 0) {
        message += `\n\n🎉 ما شاء الله! ${user.stats.currentStreak} يوم متتالية!`;

        // رسالة تحفيزية من Claude
        const motivation = await claudeAI.generateMotivationalMessage(user, {
          streak: user.stats.currentStreak
        });
        message += `\n\n${motivation}`;
      }

      await msg.reply(message);

    } catch (error) {
      console.error('Error handling prayer response:', error);
      await msg.reply('حدث خطأ في التسجيل، حاول مرة أخرى.');
    }
  }

  /**
   * إرسال إحصائيات المستخدم
   */
  async _sendUserStats(msg, user) {
    try {
      const startOfWeek = moment().startOf('week').toDate();
      const endOfWeek = moment().endOf('week').toDate();

      const weeklyPrayers = await Prayer.getUserStats(user._id, startOfWeek, endOfWeek);
      const weeklyQuran = await Quran.getUserQuranStats(user._id, startOfWeek, endOfWeek);

      let message = `📊 *إحصائياتك الأسبوعية* 📊\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;

      // الصلوات
      message += `🕌 *الصلوات:*\n`;
      let totalPrayers = 0;
      let onTimePrayers = 0;

      weeklyPrayers.forEach(stat => {
        const percentage = ((stat.onTime / stat.total) * 100).toFixed(0);
        message += `  ${stat._id}: ${stat.onTime}/${stat.total} (${percentage}%)\n`;
        totalPrayers += stat.total;
        onTimePrayers += stat.onTime;
      });

      const overallPercentage = totalPrayers > 0 ? ((onTimePrayers / totalPrayers) * 100).toFixed(0) : 0;
      message += `\n  الإجمالي: ${onTimePrayers}/${totalPrayers} (${overallPercentage}%)\n`;

      // القرآن
      message += `\n📖 *القرآن الكريم:*\n`;
      message += `  صفحات مقروءة: ${weeklyQuran.totalPages}\n`;
      message += `  جلسات القراءة: ${weeklyQuran.totalSessions}\n`;
      message += `  متوسط الصفحات: ${weeklyQuran.avgPages.toFixed(1)}\n`;

      // النقاط والشريط
      message += `\n⭐ *النقاط والإنجازات:*\n`;
      message += `  النقاط الإجمالية: ${user.stats.totalPoints}\n`;
      message += `  المستوى: ${user.stats.level}\n`;
      message += `  الشريط الحالي: ${user.stats.currentStreak} يوم 🔥\n`;
      message += `  أفضل شريط: ${user.stats.longestStreak} يوم\n`;

      // أوسمة
      if (user.badges && user.badges.length > 0) {
        message += `\n🏆 *الأوسمة:*\n`;
        user.badges.slice(0, 3).forEach(badge => {
          message += `  ${badge.icon} ${badge.name}\n`;
        });
      }

      message += `\n━━━━━━━━━━━━━━━━\n`;
      message += `💪 استمر في التقدم!`;

      await msg.reply(message);

    } catch (error) {
      console.error('Error sending stats:', error);
      await msg.reply('حدث خطأ في جلب الإحصائيات.');
    }
  }

  /**
   * إرسال أوقات الصلاة
   */
  async _sendPrayerTimes(msg, user) {
    try {
      const times = await prayerTimesService.getToday(user.location);
      const dayName = prayerTimesService.getArabicDayName();
      const hijri = times.hijriDate;

      let message = `🕌 *مواقيت الصلاة* 🕌\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      message += `📅 ${dayName}\n`;
      message += `📆 ${hijri.day} ${hijri.month.ar} ${hijri.year}هـ\n\n`;

      message += `🌅 الفجر: ${times.timings.Fajr}\n`;
      message += `☀️ الشروق: ${times.timings.Sunrise}\n`;
      message += `🌞 الظهر: ${times.timings.Dhuhr}\n`;
      message += `🌤️ العصر: ${times.timings.Asr}\n`;
      message += `🌆 المغرب: ${times.timings.Maghrib}\n`;
      message += `🌙 العشاء: ${times.timings.Isha}\n\n`;

      // الصلاة القادمة
      const nextPrayer = prayerTimesService.getNextPrayer(times.timings);
      message += `⏰ الصلاة القادمة: *${nextPrayer.prayer}*\n`;
      message += `⏳ بعد ${nextPrayer.remaining.hours}س ${nextPrayer.remaining.minutes}د\n`;

      // المناسبات
      const occasions = prayerTimesService.getIslamicOccasion();
      if (occasions.length > 0) {
        message += `\n🎉 *المناسبات:*\n`;
        occasions.forEach(occ => {
          message += `  • ${occ.name}\n`;
        });
      }

      await msg.reply(message);

    } catch (error) {
      console.error('Error sending prayer times:', error);
      await msg.reply('حدث خطأ في جلب أوقات الصلاة.');
    }
  }

  /**
   * إرسال دعاء
   */
  async _sendDuaa(msg, user) {
    try {
      await msg.reply('⏳ جاري البحث عن دعاء مناسب...');

      const duaa = await chatGPT.generateDailyContent('دعاء', {
        time: moment().format('HH:mm'),
        level: user.profile.level
      });

      let message = `🤲 *دعاء مبارك* 🤲\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      message += `"${duaa.duaa}"\n\n`;

      if (duaa.source) {
        message += `📚 المصدر: ${duaa.source}\n`;
      }

      if (duaa.virtue) {
        message += `\n💎 الفضل: ${duaa.virtue}\n`;
      }

      await msg.reply(message);

    } catch (error) {
      console.error('Error sending duaa:', error);
      await msg.reply('حدث خطأ، حاول مرة أخرى.');
    }
  }

  /**
   * إرسال ذكر
   */
  async _sendDhikr(msg, user) {
    try {
      const dhikr = await chatGPT.generateDailyContent('ذكر', {
        level: user.profile.level
      });

      let message = `📿 *ذكر مبارك* 📿\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      message += `"${dhikr.dhikr}"\n\n`;
      message += `🔢 العدد: ${dhikr.count} مرة\n`;

      if (dhikr.virtue) {
        message += `\n💎 الفضل: ${dhikr.virtue}`;
      }

      await msg.reply(message);

    } catch (error) {
      console.error('Error sending dhikr:', error);
    }
  }

  /**
   * إرسال آية
   */
  async _sendAyah(msg, user) {
    try {
      await msg.reply('⏳ جاري اختيار آية مناسبة...');

      const ayah = await chatGPT.generateDailyContent('آية', {
        level: user.profile.level
      });

      let message = `📖 *آية من القرآن الكريم* 📖\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      message += `"${ayah.ayah}"\n\n`;
      message += `📍 سورة ${ayah.surah} - آية ${ayah.ayahNumber}\n\n`;
      message += `💡 ${ayah.tafsir}\n\n`;
      message += `🎯 الفائدة: ${ayah.benefit}`;

      await msg.reply(message);

    } catch (error) {
      console.error('Error sending ayah:', error);
    }
  }

  /**
   * إرسال حديث
   */
  async _sendHadith(msg, user) {
    try {
      await msg.reply('⏳ جاري اختيار حديث شريف...');

      const hadith = await chatGPT.generateDailyContent('حديث', {
        level: user.profile.level
      });

      let message = `📜 *حديث شريف* 📜\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;
      message += `"${hadith.hadith}"\n\n`;
      message += `📌 ${hadith.narrator}\n`;
      message += `✅ ${hadith.grade} - ${hadith.source}\n\n`;
      message += `💡 ${hadith.explanation}\n\n`;
      message += `🎯 الفائدة: ${hadith.benefit}`;

      await msg.reply(message);

    } catch (error) {
      console.error('Error sending hadith:', error);
    }
  }

  /**
   * معالجة قراءة القرآن
   */
  async _handleQuranReading(msg, user) {
    try {
      let message = `📖 *تسجيل قراءة القرآن* 📖\n\n`;
      message += `أرسل عدد الصفحات التي قرأتها اليوم\n`;
      message += `مثال: "قرأت 5 صفحات" أو "5"`;

      await msg.reply(message);

      // هنا يمكن إضافة نظام انتظار الرد
      // لكن للبساطة، المستخدم يمكنه إرسال رقم مباشرة

    } catch (error) {
      console.error('Error in Quran reading:', error);
    }
  }

  /**
   * إرسال قائمة المساعدة
   */
  async _sendHelp(msg, user) {
    let message = `📱 *الأوامر المتاحة* 📱\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    message += `🕌 *الصلاة:*\n`;
    message += `  • أوقات الصلاة\n`;
    message += `  • صليت / نعم / قضاء\n\n`;
    message += `📊 *الإحصائيات:*\n`;
    message += `  • إحصائياتي\n`;
    message += `  • تحليلي\n`;
    message += `  • روتين\n\n`;
    message += `📖 *المحتوى:*\n`;
    message += `  • دعاء\n`;
    message += `  • ذكر\n`;
    message += `  • آية\n`;
    message += `  • حديث\n\n`;
    message += `🤖 *الذكاء الاصطناعي:*\n`;
    message += `  • نصيحة\n`;
    message += `  • تحليلي\n`;
    message += `  • أو اكتب أي سؤال\n\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `💬 يمكنك أيضاً التحدث معي بشكل طبيعي!`;

    await msg.reply(message);
  }

  /**
   * إرسال تحليل ذكي من Claude
   */
  async _sendAIAnalysis(msg, user) {
    try {
      await msg.reply('🤖 جاري تحليل سلوكك وعباداتك...');

      // جلب البيانات الأخيرة
      const prayers = await Prayer.find({ userId: user._id })
        .sort({ date: -1 })
        .limit(50);

      const quran = await Quran.find({ userId: user._id })
        .sort({ date: -1 })
        .limit(20);

      // التحليل بواسطة Claude
      const analysis = await claudeAI.analyzeUserBehavior(user, prayers, quran);

      let message = `🎯 *تحليلك الشخصي* 🎯\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;

      message += `✅ *نقاط القوة:*\n`;
      analysis.strengths.forEach(s => message += `  • ${s}\n`);

      message += `\n⚠️ *نقاط التحسين:*\n`;
      analysis.weaknesses.forEach(w => message += `  • ${w}\n`);

      message += `\n📈 *الاتجاهات:*\n`;
      message += `  الصلوات: ${analysis.trends.prayers}\n`;
      message += `  القرآن: ${analysis.trends.quran}\n`;

      message += `\n📊 *التقييم العام:* ${analysis.overallScore}/10\n\n`;
      message += `${analysis.summary}`;

      await msg.reply(message);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      await msg.reply('حدث خطأ في التحليل.');
    }
  }

  /**
   * إرسال نصيحة من Claude
   */
  async _sendAIAdvice(msg, user) {
    try {
      await msg.reply('💡 جاري إعداد نصائح مخصصة لك...');

      const prayers = await Prayer.find({ userId: user._id }).sort({ date: -1 }).limit(50);
      const quran = await Quran.find({ userId: user._id }).sort({ date: -1 }).limit(20);

      const analysis = await claudeAI.analyzeUserBehavior(user, prayers, quran);
      const advice = await claudeAI.generatePersonalizedAdvice(user, analysis);

      let message = `💡 *نصائح مخصصة لك* 💡\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;

      advice.advice.forEach((adv, index) => {
        message += `${index + 1}. *${adv.problem}*\n`;
        message += `   الحل: ${adv.solution}\n`;
        message += `   الدافع: ${adv.motivation}\n`;
        message += `   المدة: ${adv.duration}\n\n`;
      });

      await msg.reply(message);

    } catch (error) {
      console.error('Error in AI advice:', error);
    }
  }

  /**
   * إرسال الروتين اليومي
   */
  async _sendRoutine(msg, user) {
    try {
      await msg.reply('📅 جاري إعداد روتينك اليومي...');

      const routine = await claudeAI.suggestDailyRoutine(user);

      let message = `📅 *روتينك اليومي المقترح* 📅\n`;
      message += `━━━━━━━━━━━━━━━━\n\n`;

      routine.routine.forEach(item => {
        message += `⏰ ${item.time} - ${item.activity}\n`;
        message += `   ${item.description} (${item.duration} دقيقة)\n\n`;
      });

      message += `💡 *نصائح:*\n`;
      routine.tips.forEach(tip => message += `  • ${tip}\n`);

      await msg.reply(message);

    } catch (error) {
      console.error('Error in routine:', error);
    }
  }

  /**
   * محادثة عامة مع ChatGPT
   */
  async _handleGeneralChat(msg, user, text) {
    try {
      const response = await chatGPT.chat(text, {
        userName: user.name,
        userLevel: user.profile.level
      });

      await msg.reply(response);

    } catch (error) {
      console.error('Error in chat:', error);
      await msg.reply('عذراً، لم أفهم. جرب "مساعدة" للأوامر المتاحة.');
    }
  }

  /**
   * تحديد الصلاة الحالية
   */
  _getCurrentPrayer(timings) {
    const now = moment();
    const prayers = [
      { name: 'فجر', key: 'Fajr' },
      { name: 'ظهر', key: 'Dhuhr' },
      { name: 'عصر', key: 'Asr' },
      { name: 'مغرب', key: 'Maghrib' },
      { name: 'عشاء', key: 'Isha' }
    ];

    for (let prayer of prayers) {
      const prayerTime = moment(timings[prayer.key], 'HH:mm');
      if (now.isAfter(prayerTime)) {
        continue;
      }
      return prayer;
    }

    return prayers[0]; // الفجر
  }

  /**
   * بدء المهام المجدولة
   */
  _startScheduledTasks() {
    console.log('⏰ بدء المهام المجدولة...');

    // فحص أوقات الصلاة كل دقيقة
    cron.schedule('* * * * *', async () => {
      await this._checkPrayerTimes();
    });

    // رسالة صباحية (7:00 ص)
    cron.schedule('0 7 * * *', async () => {
      await this._sendMorningMessages();
    });

    // رسالة مسائية (6:00 م)
    cron.schedule('0 18 * * *', async () => {
      await this._sendEveningMessages();
    });

    // تقرير أسبوعي (الجمعة 10 ص)
    cron.schedule('0 10 * * 5', async () => {
      await this._sendWeeklyReports();
    });

    console.log('✅ المهام المجدولة نشطة!');
  }

  /**
   * فحص أوقات الصلاة وإرسال التذكيرات
   */
  async _checkPrayerTimes() {
    try {
      const users = await User.find({ status: 'active' });

      for (let user of users) {
        const times = await prayerTimesService.getToday(user.location);
        const prayers = ['فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء'];
        const keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        for (let i = 0; i < prayers.length; i++) {
          // قبل الأذان بـ 15 دقيقة
          if (prayerTimesService.isPrayerTime(times.timings, prayers[i], user.settings.remindersBefore)) {
            await this._sendPrayerReminder(user, prayers[i], 'before');
          }

          // وقت الأذان
          if (prayerTimesService.isPrayerTime(times.timings, prayers[i], 0)) {
            await this._sendPrayerReminder(user, prayers[i], 'now');
          }
        }
      }
    } catch (error) {
      console.error('Error checking prayer times:', error);
    }
  }

  /**
   * إرسال تذكير صلاة
   */
  async _sendPrayerReminder(user, prayer, timing) {
    try {
      let message = '';
      const emojis = {
        'فجر': '🌅',
        'ظهر': '☀️',
        'عصر': '🌤️',
        'مغرب': '🌆',
        'عشاء': '🌙'
      };

      if (timing === 'before') {
        message = `${emojis[prayer]} ${user.name}، الاستعداد لصلاة ${prayer}\n`;
        message += `⏰ بعد ${user.settings.remindersBefore} دقيقة\n\n`;
        message += `💧 لا تنس الوضوء`;
      } else {
        message = `${emojis[prayer]} *حي على الصلاة* ${emojis[prayer]}\n\n`;
        message += `وقت صلاة ${prayer} دخل الآن\n\n`;
        message += `هل صليت؟\n`;
        message += `رد بـ: صليت / قضاء / لا`;
      }

      await this.sendMessage(user.phone, message);

    } catch (error) {
      console.error('Error sending prayer reminder:', error);
    }
  }

  /**
   * إرسال رسائل صباحية
   */
  async _sendMorningMessages() {
    try {
      const users = await User.find({
        status: 'active',
        'settings.dailyContent': true
      });

      for (let user of users) {
        const occasions = prayerTimesService.getIslamicOccasion();
        const dayName = prayerTimesService.getArabicDayName();

        let message = `☀️ صباح الخير ${user.name}\n\n`;
        message += `📅 اليوم ${dayName}\n`;

        if (occasions.length > 0) {
          message += `🎉 ${occasions[0].name}\n`;
        }

        // آية الصباح
        const ayah = await chatGPT.generateDailyContent('آية', {
          occasion: occasions[0]?.name,
          level: user.profile.level
        });

        message += `\n📖 آية اليوم:\n`;
        message += `"${ayah.ayah}"\n`;
        message += `سورة ${ayah.surah}\n\n`;
        message += `💡 ${ayah.benefit}`;

        await this.sendMessage(user.phone, message);
        await this._sleep(2000); // تأخير بسيط
      }
    } catch (error) {
      console.error('Error sending morning messages:', error);
    }
  }

  /**
   * إرسال رسائل مسائية
   */
  async _sendEveningMessages() {
    try {
      const users = await User.find({
        status: 'active',
        'settings.dailyContent': true
      });

      for (let user of users) {
        const hadith = await chatGPT.generateDailyContent('حديث', {
          level: user.profile.level
        });

        let message = `🌙 مساء الخير ${user.name}\n\n`;
        message += `📜 حديث المساء:\n`;
        message += `"${hadith.hadith}"\n\n`;
        message += `${hadith.narrator}\n`;
        message += `${hadith.source}\n\n`;
        message += `💡 ${hadith.benefit}\n\n`;
        message += `🤲 لا تنس أذكار المساء`;

        await this.sendMessage(user.phone, message);
        await this._sleep(2000);
      }
    } catch (error) {
      console.error('Error sending evening messages:', error);
    }
  }

  /**
   * إرسال التقارير الأسبوعية
   */
  async _sendWeeklyReports() {
    try {
      const users = await User.find({
        status: 'active',
        'settings.weeklyReport': true
      });

      for (let user of users) {
        const startOfWeek = moment().startOf('week').toDate();
        const endOfWeek = moment().endOf('week').toDate();

        const weeklyPrayers = await Prayer.getUserStats(user._id, startOfWeek, endOfWeek);
        const weeklyQuran = await Quran.getUserQuranStats(user._id, startOfWeek, endOfWeek);

        const weekStats = {
          prayers: weeklyPrayers,
          quran: weeklyQuran
        };

        // تحليل أسبوعي من Claude
        const analysis = await claudeAI.analyzeWeeklyReport(user, weekStats);

        let message = `📊 *تقريرك الأسبوعي* 📊\n`;
        message += `━━━━━━━━━━━━━━━━\n\n`;

        message += `✅ *النقاط الإيجابية:*\n`;
        analysis.positives.forEach(p => message += `  • ${p}\n`);

        message += `\n📈 *للتحسين:*\n`;
        analysis.improvements.forEach(i => message += `  • ${i}\n`);

        message += `\n🎯 *التقييم:* ${analysis.rating}/10\n\n`;
        message += `💪 *هدف الأسبوع القادم:*\n${analysis.nextWeekGoal}\n\n`;
        message += `━━━━━━━━━━━━━━━━\n`;
        message += `${analysis.motivationalMessage}`;

        await this.sendMessage(user.phone, message);
        await this._sleep(3000);
      }
    } catch (error) {
      console.error('Error sending weekly reports:', error);
    }
  }

  /**
   * إرسال رسالة لمستخدم
   */
  async sendMessage(phone, message) {
    try {
      if (!this.isReady) {
        console.error('Bot is not ready');
        return false;
      }

      // التأكد من تنسيق الرقم
      let formattedPhone = phone.replace(/[^0-9]/g, '');
      if (!formattedPhone.endsWith('@c.us')) {
        formattedPhone += '@c.us';
      }

      await this.client.sendMessage(formattedPhone, message);
      return true;

    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * إرسال رسالة لمجموعة
   */
  async sendGroupMessage(groupId, message) {
    try {
      if (!this.isReady) {
        console.error('Bot is not ready');
        return false;
      }

      let formattedGroupId = groupId;
      if (!formattedGroupId.endsWith('@g.us')) {
        formattedGroupId += '@g.us';
      }

      await this.client.sendMessage(formattedGroupId, message);
      return true;

    } catch (error) {
      console.error('Error sending group message:', error);
      return false;
    }
  }

  /**
   * تأخير (مساعد)
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * بدء البوت
   */
  async initialize() {
    try {
      console.log('🚀 بدء تشغيل بوت الواتساب...');
      await this.client.initialize();
    } catch (error) {
      console.error('Error initializing bot:', error);
      throw error;
    }
  }

  /**
   * إيقاف البوت
   */
  async shutdown() {
    try {
      console.log('⏹️ إيقاف البوت...');
      await this.client.destroy();
      this.isReady = false;
    } catch (error) {
      console.error('Error shutting down bot:', error);
    }
  }
}

module.exports = new WhatsAppBot();
