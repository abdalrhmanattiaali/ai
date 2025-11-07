# 🌙 نبراس المؤمنين - Islamic AI Coach

نظام كوتش ديني ذكي متكامل عبر الواتساب، يجمع بين تتبع العبادات والذكاء الاصطناعي لتقديم تجربة روحانية مخصصة.

## ✨ المميزات

### 🕌 تتبع شامل للعبادات
- **الصلوات الخمس** مع تذكيرات ذكية
- **السنن والنوافل** (الضحى، الوتر، قيام الليل)
- **القرآن الكريم** - تتبع القراءة والختمات
- **الأذكار اليومية** (صباح، مساء، نوم)
- **الأدعية** موزعة على مدار اليوم
- **الصيام** (رمضان، النوافل، عاشوراء)

### 🤖 الذكاء الاصطناعي
- **Claude AI**: تحليل الأنماط وتقديم نصائح شخصية
- **ChatGPT**: محتوى ديني تفاعلي وإجابة على الأسئلة الشرعية
- **تحليل ذكي** للسلوك والالتزام
- **نصائح مخصصة** بناءً على نقاط الضعف

### 📊 نظام النقاط والإحصائيات
- نقاط لكل عبادة
- شرائط (Streaks) للأيام المتتالية
- مستويات وأوسمة
- تقارير أسبوعية وشهرية مفصلة

### 🎯 المحتوى الديني الذكي
- **يتكيف مع اليوم**: جمعة، رمضان، عشر ذي الحجة
- **دروس متدرجة**: مبتدئ، متوسط، متقدم
- **تحديات جماعية**
- **رسائل المجموعات**

## 🏗️ البنية التقنية

```
nibras-islamic-coach/
├── src/
│   ├── server.js                 # نقطة البداية
│   ├── config/                   # إعدادات التطبيق
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── ai.js
│   ├── models/                   # قاعدة البيانات
│   │   ├── User.js
│   │   ├── Prayer.js
│   │   ├── Quran.js
│   │   └── Stats.js
│   ├── services/                 # الخدمات الأساسية
│   │   ├── whatsapp/
│   │   │   ├── WhatsAppBot.js
│   │   │   └── MessageHandler.js
│   │   ├── ai/
│   │   │   ├── ClaudeService.js
│   │   │   └── ChatGPTService.js
│   │   ├── prayerTimes.js
│   │   ├── scheduler.js
│   │   └── stats.js
│   ├── controllers/              # API Controllers
│   │   ├── userController.js
│   │   ├── prayerController.js
│   │   └── statsController.js
│   ├── routes/                   # API Routes
│   │   └── api.js
│   └── utils/                    # مساعدات
│       ├── logger.js
│       └── helpers.js
├── frontend/                     # لوحة التحكم
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js v18+
- MongoDB
- Redis
- حساب WhatsApp Business API أو رقم واتساب عادي

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone https://github.com/yourusername/nibras-islamic-coach.git
cd nibras-islamic-coach
```

2. **تثبيت المكتبات**
```bash
npm install
```

3. **إعداد البيئة**
```bash
cp .env.example .env
# قم بتعديل ملف .env وإضافة API Keys
```

4. **تشغيل MongoDB و Redis**
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. **تشغيل التطبيق**
```bash
# Development
npm run dev

# Production
npm start
```

6. **مسح QR Code**
- افتح الواتساب على هاتفك
- اذهب إلى الإعدادات > الأجهزة المرتبطة
- امسح الـ QR Code الذي سيظهر في الـ Terminal

## 🔑 الحصول على API Keys

### Claude AI (Anthropic)
1. اذهب إلى: https://console.anthropic.com/
2. أنشئ حساب جديد
3. اذهب إلى API Keys
4. أنشئ مفتاح جديد
5. انسخه في `.env` → `ANTHROPIC_API_KEY`

### ChatGPT (OpenAI)
1. اذهب إلى: https://platform.openai.com/
2. أنشئ حساب جديد
3. اذهب إلى API Keys
4. أنشئ مفتاح جديد
5. انسخه في `.env` → `OPENAI_API_KEY`

## 📱 الاستخدام

### إضافة مستخدم جديد
1. افتح لوحة التحكم: `http://localhost:3000/dashboard`
2. اضغط "إضافة مستخدم"
3. أدخل الاسم ورقم الواتساب
4. حدد المستوى الديني والأهداف

### إرسال رسالة للجميع
```javascript
// من لوحة التحكم
POST /api/messages/broadcast
{
  "message": "السلام عليكم، تذكير بقراءة سورة الكهف",
  "type": "reminder"
}
```

### رسائل المجموعات
```javascript
POST /api/messages/group
{
  "groupId": "120363xxx@g.us",
  "message": "إحصائيات المجموعة الأسبوعية..."
}
```

## 🎯 أمثلة على التفاعل

**المستخدم**: إحصائياتي
**البوت**:
```
📊 إحصائياتك الأسبوعية

🕌 الصلوات: 33/35 (94%)
📖 القرآن: 45 صفحة
⭐ النقاط: 2,840
🔥 الشريط: 23 يوم

💡 نقطة تحسين: صلاة الفجر (5/7)
```

**المستخدم**: دعاء
**البوت**:
```
🤲 دعاء الوقت الحالي:

"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً
وَفِي الْآخِرَةِ حَسَنَةً
وَقِنَا عَذَابَ النَّارِ"

💎 فضله: دعاء جامع لخيري الدنيا والآخرة
```

## 🤝 المساهمة

نرحب بمساهماتكم! الرجاء:
1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit تغييراتك (`git commit -m 'إضافة ميزة رائعة'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📄 الترخيص

MIT License - راجع ملف [LICENSE](LICENSE) للتفاصيل

## 🙏 شكر خاص

- **Aladhan API** لأوقات الصلاة
- **Anthropic** لـ Claude AI
- **OpenAI** لـ ChatGPT
- **whatsapp-web.js** للتكامل مع الواتساب

## 📞 التواصل

لأي استفسارات أو مقترحات:
- Email: support@nibras-coach.com
- Twitter: @NibrasCoach

---

**جُعل في خدمة الإسلام والمسلمين** 🌙
