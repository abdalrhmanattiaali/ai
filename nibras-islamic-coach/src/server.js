require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./config/database');
const whatsappBot = require('./services/whatsapp/WhatsAppBot');

// إنشاء التطبيق
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logger بسيط
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🌙 نبراس المؤمنين - Islamic AI Coach',
    version: '1.0.0',
    status: 'running',
    whatsappStatus: whatsappBot.isReady ? 'connected' : 'disconnected'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: database.connection ? 'connected' : 'disconnected',
    whatsapp: whatsappBot.isReady ? 'connected' : 'disconnected'
  });
});

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'الصفحة غير موجودة'
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

/**
 * بدء التطبيق
 */
async function startServer() {
  try {
    console.log('🚀 بدء تشغيل نبراس المؤمنين...\n');

    // 1. الاتصال بقاعدة البيانات
    console.log('📊 الاتصال بقاعدة البيانات...');
    await database.connect();
    console.log('');

    // 2. بدء السيرفر
    app.listen(PORT, () => {
      console.log(`🌐 السيرفر يعمل على المنفذ ${PORT}`);
      console.log(`📡 الرابط: http://localhost:${PORT}`);
      console.log('');
    });

    // 3. بدء بوت الواتساب
    console.log('📱 بدء بوت الواتساب...');
    await whatsappBot.initialize();
    console.log('');

    console.log('✅ النظام جاهز للعمل!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🕌 نبراس المؤمنين - في خدمة الإسلام');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ فشل في بدء التطبيق:', error);
    process.exit(1);
  }
}

/**
 * إيقاف التطبيق بشكل آمن
 */
async function gracefulShutdown() {
  console.log('\n\n⏹️  إيقاف التطبيق...');

  try {
    // إيقاف بوت الواتساب
    await whatsappBot.shutdown();

    // قطع الاتصال بقاعدة البيانات
    await database.disconnect();

    console.log('✅ تم إيقاف التطبيق بنجاح');
    process.exit(0);

  } catch (error) {
    console.error('❌ خطأ في إيقاف التطبيق:', error);
    process.exit(1);
  }
}

// معالجة إشارات الإيقاف
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// معالجة الأخطاء غير المعالجة
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// بدء التطبيق
if (require.main === module) {
  startServer();
}

module.exports = app;
