const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../database/db');
const aiService = require('./ai-service');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.messageHandlers = new Map();
  }

  async initialize() {
    console.log('🔄 جاري تهيئة WhatsApp...');

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    // QR Code للاتصال
    this.client.on('qr', (qr) => {
      console.log('\n📱 امسح رمز QR التالي بواتساب:\n');
      qrcode.generate(qr, { small: true });
    });

    // عند الاتصال
    this.client.on('ready', () => {
      console.log('✅ WhatsApp جاهز للعمل!');
      this.isReady = true;
    });

    // عند استقبال رسالة
    this.client.on('message', async (msg) => {
      await this.handleIncomingMessage(msg);
    });

    // عند قطع الاتصال
    this.client.on('disconnected', (reason) => {
      console.log('❌ تم قطع الاتصال:', reason);
      this.isReady = false;
    });

    // بدء الاتصال
    await this.client.initialize();
  }

  async handleIncomingMessage(msg) {
    try {
      // تجاهل الرسائل من المجموعات
      if (msg.from.includes('@g.us')) {
        return;
      }

      // الحصول على رقم المرسل
      const phoneNumber = msg.from.replace('@c.us', '');

      console.log(`📨 رسالة من ${phoneNumber}: ${msg.body}`);

      // التحقق من نوع المرسل (أب أو أم)
      const fatherInfo = await db.getParentInfo('father');
      const motherInfo = await db.getParentInfo('mother');

      let parentType = null;
      let parentInfo = null;

      if (fatherInfo && phoneNumber === fatherInfo.phone) {
        parentType = 'father';
        parentInfo = fatherInfo;
      } else if (motherInfo && phoneNumber === motherInfo.phone) {
        parentType = 'mother';
        parentInfo = motherInfo;
      }

      if (!parentType) {
        // رسالة من رقم غير مسجل
        await this.sendMessage(
          msg.from,
          'مرحباً! للاستفادة من النظام، يرجى التسجيل أولاً من خلال لوحة التحكم.'
        );
        return;
      }

      // حفظ الرسالة في الذاكرة
      await db.addMemory(parentType, 'received', msg.body);

      // معالجة الأوامر الخاصة
      if (msg.body.startsWith('/')) {
        await this.handleCommand(msg, parentType, parentInfo);
        return;
      }

      // توليد رد من AI
      const childInfo = await db.getChildInfo();
      const recentMemory = await db.getRecentMemory(parentType, 5);

      const response = await aiService.respondToParentMessage(
        msg.body,
        parentType,
        {
          childInfo,
          parentInfo,
          recentMemory
        }
      );

      // إرسال الرد
      await this.sendMessage(msg.from, response);

      // حفظ الرد في الذاكرة
      await db.addMemory(parentType, 'sent', response);

      // حفظ التفاعل
      await db.addInteraction(parentType, 'question', msg.body, response);

    } catch (error) {
      console.error('❌ خطأ في معالجة الرسالة:', error);
      await this.sendMessage(
        msg.from,
        'عذراً، حدث خطأ في معالجة رسالتك. الرجاء المحاولة مرة أخرى.'
      );
    }
  }

  async handleCommand(msg, parentType, parentInfo) {
    const command = msg.body.toLowerCase().trim();
    const childInfo = await db.getChildInfo();

    switch (command) {
      case '/help':
      case '/مساعدة':
        await this.sendMessage(msg.from, `
الأوامر المتاحة:

/help - عرض قائمة الأوامر
/info - معلومات الطفل
/tips - نصائح يومية
/activities - اقتراح أنشطة
/books - ترشيح كتب
/courses - ترشيح دورات
/outings - اقتراح أماكن فسح
/exercises - تمارين للطفل
/weather - حالة الطقس

يمكنك أيضاً إرسال أي سؤال وسأجيبك! 😊
        `);
        break;

      case '/info':
      case '/معلومات':
        if (!childInfo) {
          await this.sendMessage(msg.from, 'لم يتم إدخال معلومات الطفل بعد. الرجاء التسجيل من لوحة التحكم.');
        } else {
          const age = this.calculateAge(childInfo.birth_date);
          await this.sendMessage(msg.from, `
معلومات ${childInfo.nickname || childInfo.name}:

👶 الاسم: ${childInfo.name}
💝 اسم الدلع: ${childInfo.nickname || 'غير محدد'}
🎂 العمر: ${age}
⚖️ الوزن: ${childInfo.weight || 'غير محدد'} كجم
📏 الطول: ${childInfo.height || 'غير محدد'} سم
          `);
        }
        break;

      case '/tips':
      case '/نصائح':
        const tips = await aiService.generateMiddayCheck(childInfo, parentInfo);
        await this.sendMessage(msg.from, tips);
        break;

      case '/activities':
      case '/أنشطة':
        const activities = await aiService.generateEveningActivities(childInfo, parentInfo);
        await this.sendMessage(msg.from, activities);
        break;

      case '/books':
      case '/كتب':
        const age = this.calculateAge(childInfo.birth_date);
        const books = await aiService.recommendBooks(age);
        await this.sendMessage(msg.from, books);
        break;

      case '/courses':
      case '/دورات':
        const parentName = parentType === 'father' ? 'الأب' : 'الأم';
        const courses = await aiService.recommendCourses(parentName, 'التربية وتطوير الأطفال');
        await this.sendMessage(msg.from, courses);
        break;

      case '/outings':
      case '/فسح':
        const childAge = this.calculateAge(childInfo.birth_date);
        const outings = await aiService.suggestOutings(
          childAge,
          process.env.WEATHER_CITY?.split(',')[0] || 'القاهرة',
          this.getCurrentSeason()
        );
        await this.sendMessage(msg.from, outings);
        break;

      case '/exercises':
      case '/تمارين':
        const exerciseAge = this.calculateAge(childInfo.birth_date);
        const exercises = await aiService.suggestExercises(exerciseAge);
        await this.sendMessage(msg.from, exercises);
        break;

      case '/weather':
      case '/طقس':
        const weatherService = require('./weather-service');
        const weather = await weatherService.getCurrentWeather();
        const weatherMsg = weatherService.formatWeatherMessage(weather);
        await this.sendMessage(msg.from, weatherMsg);
        break;

      default:
        await this.sendMessage(msg.from, 'أمر غير معروف. أرسل /help لعرض قائمة الأوامر.');
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.isReady) {
        console.warn('⚠️ WhatsApp غير جاهز بعد');
        return false;
      }

      await this.client.sendMessage(to, message);
      console.log(`✅ تم إرسال رسالة إلى ${to}`);
      return true;
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      return false;
    }
  }

  async sendMessageToParent(parentType, message) {
    try {
      const parentInfo = await db.getParentInfo(parentType);

      if (!parentInfo || !parentInfo.phone) {
        console.warn(`⚠️ رقم ${parentType === 'father' ? 'الأب' : 'الأم'} غير موجود`);
        return false;
      }

      const phoneNumber = `${parentInfo.phone}@c.us`;
      const success = await this.sendMessage(phoneNumber, message);

      if (success) {
        // حفظ في الذاكرة
        await db.addMemory(parentType, 'sent', message);
      }

      return success;
    } catch (error) {
      console.error('❌ خطأ في إرسال رسالة للوالد:', error);
      return false;
    }
  }

  async sendMessageToBothParents(message) {
    const results = await Promise.all([
      this.sendMessageToParent('father', message),
      this.sendMessageToParent('mother', message)
    ]);

    return results.every(r => r === true);
  }

  calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return `${months} شهر`;
    } else if (months === 0) {
      return `${years} سنة`;
    } else {
      return `${years} سنة و ${months} شهر`;
    }
  }

  getCurrentSeason() {
    const month = new Date().getMonth() + 1;

    if (month >= 3 && month <= 5) return 'الربيع';
    if (month >= 6 && month <= 8) return 'الصيف';
    if (month >= 9 && month <= 11) return 'الخريف';
    return 'الشتاء';
  }

  isConnected() {
    return this.isReady;
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('❌ تم قطع اتصال WhatsApp');
    }
  }
}

module.exports = new WhatsAppService();
