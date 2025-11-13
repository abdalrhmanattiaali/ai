const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const db = require('./database/db');
const whatsappService = require('./services/whatsapp-service');
const schedulerService = require('./services/scheduler-service');
const weatherService = require('./services/weather-service');
const aiService = require('./services/ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========== Routes ==========

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== Child Info API ==========

// جلب معلومات الطفل
app.get('/api/child', async (req, res) => {
  try {
    const child = await db.getChildInfo();
    res.json({ success: true, data: child });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// حفظ/تحديث معلومات الطفل
app.post('/api/child', async (req, res) => {
  try {
    await db.saveChildInfo(req.body);
    res.json({ success: true, message: 'تم حفظ معلومات الطفل بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Parent Info API ==========

// جلب معلومات الوالدين
app.get('/api/parents', async (req, res) => {
  try {
    const parents = await db.getAllParents();
    res.json({ success: true, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// جلب معلومات والد محدد
app.get('/api/parent/:type', async (req, res) => {
  try {
    const parent = await db.getParentInfo(req.params.type);
    res.json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// حفظ/تحديث معلومات والد
app.post('/api/parent', async (req, res) => {
  try {
    await db.saveParentInfo(req.body);
    res.json({ success: true, message: 'تم حفظ معلومات الوالد بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Memory & Interactions API ==========

// جلب الذاكرة الحديثة
app.get('/api/memory', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const memory = await db.getAllMemory(limit);
    res.json({ success: true, data: memory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// جلب التفاعلات
app.get('/api/interactions', async (req, res) => {
  try {
    const parentType = req.query.parent_type || null;
    const limit = req.query.limit || 20;
    const interactions = await db.getInteractions(parentType, limit);
    res.json({ success: true, data: interactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Measurements API ==========

// جلب القياسات
app.get('/api/measurements', async (req, res) => {
  try {
    const measurements = await db.getMeasurements(20);
    res.json({ success: true, data: measurements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// إضافة قياس جديد
app.post('/api/measurements', async (req, res) => {
  try {
    const { weight, height, notes } = req.body;
    await db.addMeasurement(weight, height, notes);
    res.json({ success: true, message: 'تم إضافة القياس بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Activities API ==========

// جلب الأنشطة
app.get('/api/activities', async (req, res) => {
  try {
    const status = req.query.status || null;
    const activities = await db.getActivities(status, 50);
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// إضافة نشاط جديد
app.post('/api/activities', async (req, res) => {
  try {
    const { activity_type, title, description, target } = req.body;
    await db.addActivity(activity_type, title, description, target);
    res.json({ success: true, message: 'تم إضافة النشاط بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تحديث حالة نشاط
app.put('/api/activities/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.updateActivityStatus(req.params.id, status);
    res.json({ success: true, message: 'تم تحديث حالة النشاط' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Schedules API ==========

// جلب الجدولات
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await schedulerService.getAllSchedules();
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// تحديث جدولة
app.put('/api/schedules/:id', async (req, res) => {
  try {
    await schedulerService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, message: 'تم تحديث الجدولة بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// إضافة جدولة جديدة
app.post('/api/schedules', async (req, res) => {
  try {
    const schedule = await schedulerService.addSchedule(req.body);
    res.json({ success: true, data: schedule, message: 'تم إضافة الجدولة بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// حذف جدولة
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await schedulerService.removeSchedule(req.params.id);
    res.json({ success: true, message: 'تم حذف الجدولة بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== WhatsApp API ==========

// حالة الاتصال
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    success: true,
    connected: whatsappService.isConnected()
  });
});

// إرسال رسالة فورية
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { messageType, target } = req.body;
    const success = await schedulerService.sendImmediateMessage(messageType, target);
    res.json({
      success,
      message: success ? 'تم إرسال الرسالة بنجاح' : 'فشل إرسال الرسالة'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Weather API ==========

// جلب حالة الطقس
app.get('/api/weather', async (req, res) => {
  try {
    const weather = await weatherService.getCurrentWeather();
    res.json({ success: true, data: weather });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== AI API ==========

// توليد توصيات
app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { type, ...params } = req.body;
    let result;

    switch (type) {
      case 'books':
        result = await aiService.recommendBooks(params.age, params.interests);
        break;
      case 'courses':
        result = await aiService.recommendCourses(params.audience, params.topic);
        break;
      case 'youtube':
        result = await aiService.recommendYouTubeContent(params.topic, params.audience);
        break;
      case 'outings':
        result = await aiService.suggestOutings(params.age, params.city, params.season);
        break;
      case 'exercises':
        result = await aiService.suggestExercises(params.age);
        break;
      default:
        throw new Error('نوع توصية غير معروف');
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Statistics API ==========

// إحصائيات عامة
app.get('/api/stats', async (req, res) => {
  try {
    const totalMemory = await db.query('SELECT COUNT(*) as count FROM memory');
    const totalInteractions = await db.query('SELECT COUNT(*) as count FROM interactions');
    const totalActivities = await db.query('SELECT COUNT(*) as count FROM activities');
    const completedActivities = await db.query("SELECT COUNT(*) as count FROM activities WHERE status='completed'");
    const measurements = await db.query('SELECT COUNT(*) as count FROM measurements');

    res.json({
      success: true,
      data: {
        totalMessages: totalMemory[0].count,
        totalInteractions: totalInteractions[0].count,
        totalActivities: totalActivities[0].count,
        completedActivities: completedActivities[0].count,
        totalMeasurements: measurements[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== Server Initialization ==========

async function startServer() {
  try {
    console.log('🚀 بدء تشغيل الخادم...\n');

    // تهيئة WhatsApp
    await whatsappService.initialize();

    // انتظار اتصال WhatsApp
    console.log('\n⏳ في انتظار اتصال WhatsApp...');
    while (!whatsappService.isConnected()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // تهيئة الجدولة
    await schedulerService.initialize();

    // بدء الخادم
    app.listen(PORT, () => {
      console.log(`\n✅ الخادم يعمل على المنفذ ${PORT}`);
      console.log(`🌐 افتح المتصفح على: http://localhost:${PORT}`);
      console.log('\n📱 النظام جاهز للعمل!\n');
    });

  } catch (error) {
    console.error('❌ خطأ في بدء الخادم:', error);
    process.exit(1);
  }
}

// معالجة إيقاف التشغيل
process.on('SIGINT', async () => {
  console.log('\n\n⏹️ جاري إيقاف النظام...');

  schedulerService.stopAll();
  await whatsappService.disconnect();

  console.log('👋 تم إيقاف النظام بنجاح');
  process.exit(0);
});

// بدء التشغيل
startServer();
