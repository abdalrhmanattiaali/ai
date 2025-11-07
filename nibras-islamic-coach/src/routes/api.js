const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Prayer = require('../models/Prayer');
const Quran = require('../models/Quran');
const Content = require('../models/Content');

const whatsappBot = require('../services/whatsapp/WhatsAppBot');
const prayerTimesService = require('../services/prayerTimes');
const claudeAI = require('../services/ai/ClaudeService');
const chatGPT = require('../services/ai/ChatGPTService');

// ============= Users APIs =============

/**
 * الحصول على كل المستخدمين
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * الحصول على مستخدم بالـ ID
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إضافة مستخدم جديد
 */
router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();

    // إرسال رسالة ترحيب
    const welcomeMessage = `🌙 مرحباً بك في نبراس المؤمنين!\n\n` +
      `السلام عليكم ${user.name} 👋\n\n` +
      `أنا نبراس، مساعدك الديني الشخصي.\n` +
      `سأساعدك على:\n` +
      `✅ المحافظة على الصلوات\n` +
      `📖 قراءة القرآن يومياً\n` +
      `🤲 الأذكار والأدعية\n` +
      `📊 تتبع تقدمك الديني\n\n` +
      `اكتب "مساعدة" لمعرفة الأوامر المتاحة.`;

    await whatsappBot.sendMessage(user.phone, welcomeMessage);

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * تحديث مستخدم
 */
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * حذف مستخدم
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إحصائيات مستخدم محدد
 */
router.get('/users/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const prayers = await Prayer.getUserStats(req.params.id, startOfWeek, endOfWeek);
    const quran = await Quran.getUserQuranStats(req.params.id, startOfWeek, endOfWeek);

    res.json({
      success: true,
      stats: {
        user: {
          name: user.name,
          level: user.stats.level,
          points: user.stats.totalPoints,
          currentStreak: user.stats.currentStreak,
          longestStreak: user.stats.longestStreak
        },
        weekly: {
          prayers,
          quran
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= Messages APIs =============

/**
 * إرسال رسالة لمستخدم
 */
router.post('/messages/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف والرسالة مطلوبان'
      });
    }

    const sent = await whatsappBot.sendMessage(phone, message);

    res.json({
      success: sent,
      message: sent ? 'تم إرسال الرسالة' : 'فشل إرسال الرسالة'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إرسال رسالة جماعية لكل المستخدمين
 */
router.post('/messages/broadcast', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'الرسالة مطلوبة'
      });
    }

    const users = await User.find({ status: 'active' });
    let sent = 0;
    let failed = 0;

    for (let user of users) {
      const success = await whatsappBot.sendMessage(user.phone, message);
      if (success) sent++;
      else failed++;

      // تأخير بسيط لتجنب الحظر
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.json({
      success: true,
      sent,
      failed,
      total: users.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إرسال رسالة لمجموعة
 */
router.post('/messages/group', async (req, res) => {
  try {
    const { groupId, message } = req.body;

    if (!groupId || !message) {
      return res.status(400).json({
        success: false,
        error: 'معرف المجموعة والرسالة مطلوبان'
      });
    }

    const sent = await whatsappBot.sendGroupMessage(groupId, message);

    res.json({
      success: sent,
      message: sent ? 'تم إرسال الرسالة للمجموعة' : 'فشل الإرسال'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= Prayer Times APIs =============

/**
 * أوقات الصلاة لمدينة
 */
router.get('/prayer-times', async (req, res) => {
  try {
    const { city = 'Cairo', country = 'Egypt' } = req.query;

    const times = await prayerTimesService.getToday({ city, country });

    res.json({
      success: true,
      times
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * التاريخ الهجري
 */
router.get('/hijri-date', (req, res) => {
  try {
    const hijri = prayerTimesService.getHijriDate();
    const occasions = prayerTimesService.getIslamicOccasion();

    res.json({
      success: true,
      hijri,
      occasions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= AI APIs =============

/**
 * تحليل مستخدم بواسطة Claude
 */
router.post('/ai/analyze', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const prayers = await Prayer.find({ userId }).sort({ date: -1 }).limit(50);
    const quran = await Quran.find({ userId }).sort({ date: -1 }).limit(20);

    const analysis = await claudeAI.analyzeUserBehavior(user, prayers, quran);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * نصائح مخصصة من Claude
 */
router.post('/ai/advice', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const prayers = await Prayer.find({ userId }).sort({ date: -1 }).limit(50);
    const quran = await Quran.find({ userId }).sort({ date: -1 }).limit(20);

    const analysis = await claudeAI.analyzeUserBehavior(user, prayers, quran);
    const advice = await claudeAI.generatePersonalizedAdvice(user, analysis);

    res.json({
      success: true,
      advice
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * محتوى يومي من ChatGPT
 */
router.post('/ai/content', async (req, res) => {
  try {
    const { type, context } = req.body;

    const content = await chatGPT.generateDailyContent(type, context);

    res.json({
      success: true,
      content
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * إجابة سؤال شرعي
 */
router.post('/ai/ask', async (req, res) => {
  try {
    const { question, level = 'متوسط' } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'السؤال مطلوب'
      });
    }

    const answer = await chatGPT.answerIslamicQuestion(question, level);

    res.json({
      success: true,
      question,
      answer
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= Dashboard Stats =============

/**
 * إحصائيات عامة للوحة التحكم
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPrayers = await Prayer.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    const totalPoints = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.totalPoints' } } }
    ]);

    // المتصدرون
    const topUsers = await User.find()
      .sort({ 'stats.totalPoints': -1 })
      .limit(10)
      .select('name stats.totalPoints stats.currentStreak');

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        todayPrayers,
        totalPoints: totalPoints[0]?.total || 0,
        topUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
