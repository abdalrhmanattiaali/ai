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

router.get('/users', async (req, res) => {
  try {
    const users = User.findAll();
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = User.create(req.body);

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

router.put('/users/:id', async (req, res) => {
  try {
    const user = User.update(req.params.id, req.body);

    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const deleted = User.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/:id/stats', async (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const prayers = Prayer.getUserStats(req.params.id, startOfWeek, endOfWeek);
    const quran = Quran.getUserQuranStats(req.params.id, startOfWeek, endOfWeek);

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

router.post('/messages/broadcast', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'الرسالة مطلوبة'
      });
    }

    const users = User.findAll({ status: 'active' });
    let sent = 0;
    let failed = 0;

    for (let user of users) {
      const success = await whatsappBot.sendMessage(user.phone, message);
      if (success) sent++;
      else failed++;

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

router.post('/ai/analyze', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    // سيتم تنفيذ هذا لاحقاً مع تحديث WhatsAppBot
    const prayers = []; // Prayer.findRecent(userId, 50);
    const quran = []; // Quran.findRecent(userId, 20);

    const analysis = await claudeAI.analyzeUserBehavior(user, prayers, quran);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/advice', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    const prayers = [];
    const quran = [];

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

router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = User.count();
    const activeUsers = User.count({ status: 'active' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPrayers = Prayer.count({
      date: today.toISOString()
    });

    const allUsers = User.findAll();
    const totalPoints = allUsers.reduce((sum, u) => sum + u.stats.totalPoints, 0);

    const topUsers = User.findAll()
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
      .slice(0, 10)
      .map(u => ({
        _id: u.id,
        name: u.name,
        stats: {
          totalPoints: u.stats.totalPoints,
          currentStreak: u.stats.currentStreak
        }
      }));

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        todayPrayers,
        totalPoints,
        topUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
