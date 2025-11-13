const cron = require('node-cron');
const moment = require('moment-timezone');
const db = require('../database/db');
const whatsappService = require('./whatsapp-service');
const weatherService = require('./weather-service');
const aiService = require('./ai-service');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.timezone = process.env.TIMEZONE || 'Africa/Cairo';
    moment.tz.setDefault(this.timezone);
  }

  async initialize() {
    console.log('🕐 جاري تهيئة نظام الجدولة...');

    // جلب جميع الجداول المفعلة
    const schedules = await db.getSchedules(true);

    for (const schedule of schedules) {
      this.scheduleJob(schedule);
    }

    console.log(`✅ تم جدولة ${schedules.length} مهمة`);
  }

  scheduleJob(schedule) {
    const [hours, minutes] = schedule.time.split(':');
    const cronExpression = `${minutes} ${hours} * * *`; // كل يوم في الوقت المحدد

    const job = cron.schedule(
      cronExpression,
      async () => {
        await this.executeSchedule(schedule);
      },
      {
        timezone: this.timezone
      }
    );

    this.jobs.set(schedule.id, job);
    console.log(`📅 تم جدولة: ${schedule.schedule_type} في ${schedule.time}`);
  }

  async executeSchedule(schedule) {
    try {
      console.log(`⏰ تنفيذ جدولة: ${schedule.schedule_type} - ${schedule.time}`);

      const childInfo = await db.getChildInfo();
      const fatherInfo = await db.getParentInfo('father');
      const motherInfo = await db.getParentInfo('mother');

      let message = '';

      switch (schedule.message_template || schedule.schedule_type) {
        case 'weather_greeting':
          message = await this.generateWeatherGreeting(childInfo, fatherInfo, motherInfo);
          break;

        case 'daily_tips':
          message = await this.generateDailyTips(childInfo, schedule.target === 'father' ? fatherInfo : motherInfo);
          break;

        case 'midday_check':
          message = await this.generateMiddayCheck(childInfo, fatherInfo);
          break;

        case 'evening_activities':
          message = await this.generateEveningActivities(childInfo, fatherInfo, motherInfo);
          break;

        case 'bedtime_routine':
          message = await this.generateBedtimeRoutine(childInfo, fatherInfo, motherInfo);
          break;

        default:
          console.warn(`⚠️ نوع رسالة غير معروف: ${schedule.message_template}`);
          return;
      }

      // إرسال الرسالة حسب الهدف
      let success = false;
      if (schedule.target === 'both') {
        success = await whatsappService.sendMessageToBothParents(message);
      } else if (schedule.target === 'father') {
        success = await whatsappService.sendMessageToParent('father', message);
      } else if (schedule.target === 'mother') {
        success = await whatsappService.sendMessageToParent('mother', message);
      }

      if (success) {
        // تحديث آخر موعد إرسال
        await db.updateScheduleLastSent(schedule.id);
        console.log(`✅ تم إرسال: ${schedule.schedule_type}`);
      } else {
        console.error(`❌ فشل إرسال: ${schedule.schedule_type}`);
      }

    } catch (error) {
      console.error(`❌ خطأ في تنفيذ الجدولة ${schedule.schedule_type}:`, error);
    }
  }

  async generateWeatherGreeting(childInfo, fatherInfo, motherInfo) {
    const weather = await weatherService.getCurrentWeather();
    const weatherMsg = weatherService.formatWeatherMessage(weather);

    const greeting = `🌅 صباح الخير!

${weatherMsg}

`;

    const parentInfo = fatherInfo || motherInfo;
    const aiTip = await aiService.generateMorningTips(childInfo, parentInfo, weather.description);

    return greeting + aiTip;
  }

  async generateDailyTips(childInfo, parentInfo) {
    return await aiService.generateMorningTips(childInfo, parentInfo, '');
  }

  async generateMiddayCheck(childInfo, parentInfo) {
    return await aiService.generateMiddayCheck(childInfo, parentInfo);
  }

  async generateEveningActivities(childInfo, fatherInfo, motherInfo) {
    const parentInfo = fatherInfo || motherInfo;
    return await aiService.generateEveningActivities(childInfo, parentInfo);
  }

  async generateBedtimeRoutine(childInfo, fatherInfo, motherInfo) {
    const parentInfo = fatherInfo || motherInfo;
    return await aiService.generateBedtimeRoutine(childInfo, parentInfo);
  }

  // إضافة جدولة جديدة
  async addSchedule(scheduleData) {
    const { schedule_type, time, target, message_template } = scheduleData;

    const result = await db.run(
      `INSERT INTO schedules (schedule_type, time, target, message_template) VALUES (?, ?, ?, ?)`,
      [schedule_type, time, target, message_template]
    );

    const schedule = {
      id: result.id,
      ...scheduleData,
      enabled: 1
    };

    this.scheduleJob(schedule);

    return schedule;
  }

  // تعديل جدولة
  async updateSchedule(id, scheduleData) {
    await db.updateSchedule(id, scheduleData);

    // إيقاف الجدولة القديمة
    if (this.jobs.has(id)) {
      this.jobs.get(id).stop();
      this.jobs.delete(id);
    }

    // إعادة جدولة إذا كانت مفعلة
    if (scheduleData.enabled) {
      const schedule = await db.get('SELECT * FROM schedules WHERE id=?', [id]);
      this.scheduleJob(schedule);
    }
  }

  // حذف جدولة
  async removeSchedule(id) {
    if (this.jobs.has(id)) {
      this.jobs.get(id).stop();
      this.jobs.delete(id);
    }

    await db.run('DELETE FROM schedules WHERE id=?', [id]);
  }

  // إرسال رسالة فورية (خارج الجدولة)
  async sendImmediateMessage(messageType, target) {
    const childInfo = await db.getChildInfo();
    const fatherInfo = await db.getParentInfo('father');
    const motherInfo = await db.getParentInfo('mother');

    let message = '';

    switch (messageType) {
      case 'tips':
        message = await aiService.generateMorningTips(
          childInfo,
          target === 'father' ? fatherInfo : motherInfo,
          ''
        );
        break;

      case 'activities':
        message = await aiService.generateEveningActivities(
          childInfo,
          target === 'father' ? fatherInfo : motherInfo
        );
        break;

      case 'weather':
        const weather = await weatherService.getCurrentWeather();
        message = weatherService.formatWeatherMessage(weather);
        break;

      default:
        throw new Error('نوع رسالة غير معروف');
    }

    if (target === 'both') {
      return await whatsappService.sendMessageToBothParents(message);
    } else {
      return await whatsappService.sendMessageToParent(target, message);
    }
  }

  // الحصول على جميع الجدولات
  async getAllSchedules() {
    return await db.getSchedules();
  }

  // إيقاف جميع الجدولات
  stopAll() {
    for (const [id, job] of this.jobs.entries()) {
      job.stop();
      console.log(`⏹️ تم إيقاف الجدولة ${id}`);
    }
    this.jobs.clear();
  }

  // إعادة تشغيل جميع الجدولات
  async restartAll() {
    this.stopAll();
    await this.initialize();
  }
}

module.exports = new SchedulerService();
