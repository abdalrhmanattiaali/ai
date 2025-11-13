# 🌟 نظام متابعة نمو الطفل الذكي | AI Child Growth Tracking System

<div dir="rtl">

## 📖 نظرة عامة

نظام متكامل وذكي لمتابعة نمو ورعاية الأطفال، يستخدم الذكاء الصناعي لتقديم نصائح مخصصة ودعم يومي للآباء والأمهات من خلال رسائل واتساب تلقائية.

### ✨ المميزات الرئيسية

- 🤖 **ذكاء صناعي متقدم**: تكامل مع OpenAI GPT-4 أو Anthropic Claude
- 📱 **رسائل واتساب تلقائية**: إرسال نصائح وتوصيات يومية
- 📊 **لوحة تحكم شاملة**: واجهة عربية جميلة وسهلة الاستخدام
- 💾 **نظام ذاكرة ذكي**: يتذكر جميع المحادثات ويتعلم من التفاعلات
- ⏰ **جدولة مرنة**: إرسال رسائل في أوقات محددة طوال اليوم
- 🌤️ **تكامل الطقس**: نصائح مخصصة حسب حالة الطقس اليومية
- 📚 **توصيات مخصصة**: كتب، دورات، فيديوهات، أماكن فسح، وتمارين
- 📈 **تتبع النمو**: متابعة الوزن والطول وتطور الطفل
- 🎯 **إدارة الأنشطة**: تخطيط وتتبع الأنشطة اليومية

## 🚀 المتطلبات

- Node.js (v16 أو أحدث)
- npm أو yarn
- حساب WhatsApp
- مفتاح API من OpenAI أو Anthropic
- مفتاح API من OpenWeatherMap (اختياري)

## 📦 التثبيت

### 1. تحميل المشروع

```bash
# تحميل المشروع
git clone <repository-url>
cd child-growth-ai-system

# تثبيت المكتبات
npm install
```

### 2. إعداد ملف البيئة

```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env
```

قم بتعديل ملف `.env` وأضف المفاتيح الخاصة بك:

```env
# اختر نوع الذكاء الصناعي
AI_PROVIDER=openai  # أو anthropic

# مفتاح OpenAI (إذا اخترت openai)
OPENAI_API_KEY=sk-your-key-here

# أو مفتاح Anthropic (إذا اخترت anthropic)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# مفتاح الطقس من OpenWeatherMap (اختياري)
WEATHER_API_KEY=your-weather-key-here
WEATHER_CITY=Cairo,EG

# رقم المنفذ
PORT=3000

# أرقام الهواتف (سيتم إدخالها من لوحة التحكم لاحقاً)
FATHER_PHONE=
MOTHER_PHONE=

# المنطقة الزمنية
TIMEZONE=Africa/Cairo
```

### 3. إنشاء قاعدة البيانات

```bash
npm run init-db
```

## 🎯 التشغيل

### تشغيل عادي

```bash
npm start
```

### تشغيل للتطوير (مع إعادة تشغيل تلقائية)

```bash
npm run dev
```

## 📱 الاستخدام

### 1. الاتصال بواتساب

عند تشغيل النظام لأول مرة:

1. سيظهر رمز QR في Terminal
2. افتح واتساب على هاتفك
3. اذهب إلى الإعدادات > الأجهزة المرتبطة
4. امسح رمز QR
5. انتظر رسالة "✅ WhatsApp جاهز للعمل!"

### 2. إعداد النظام

1. افتح المتصفح على: `http://localhost:3000`
2. اذهب إلى تبويب "⚙️ الإعدادات"
3. أدخل معلومات الطفل:
   - الاسم
   - اسم الدلع
   - تاريخ الميلاد
   - الجنس
   - الوزن والطول
4. أدخل معلومات الأب والأم:
   - الاسم
   - رقم الهاتف (بدون + أو 00)
   - المستوى التعليمي
   - الاهتمامات

### 3. الجدولة التلقائية

النظام يأتي مع جدولة افتراضية:

- **7:00 ص**: رسالة صباحية مع حالة الطقس (للأب والأم)
- **9:00 ص**: نصائح يومية (للأم)
- **12:00 م**: متابعة منتصف اليوم (للأب)
- **6:00 م**: اقتراح أنشطة مسائية (للأب والأم)
- **9:00 م**: روتين ما قبل النوم (للأب والأم)

يمكنك تعديل الأوقات أو تفعيل/تعطيل أي جدولة من لوحة التحكم.

### 4. التفاعل مع النظام

الوالدان يمكنهم:

- إرسال أي سؤال وسيرد الذكاء الصناعي
- استخدام الأوامر الخاصة:
  - `/help` - قائمة الأوامر
  - `/info` - معلومات الطفل
  - `/tips` - نصائح يومية
  - `/activities` - اقتراح أنشطة
  - `/books` - ترشيح كتب
  - `/courses` - ترشيح دورات
  - `/outings` - اقتراح أماكن فسح
  - `/exercises` - تمارين للطفل
  - `/weather` - حالة الطقس

## 🎨 لوحة التحكم

### التبويبات المتاحة

#### ⚙️ الإعدادات
- إدارة معلومات الطفل
- إدارة معلومات الوالدين

#### 📊 لوحة المعلومات
- إحصائيات النظام
- حالة الطقس الحالية
- إرسال رسائل فورية

#### ⏰ الجدولة
- عرض جميع الجدولات
- تفعيل/تعطيل الجدولات
- تعديل الأوقات

#### 🎯 الأنشطة
- عرض الأنشطة المقترحة
- تحديد حالة الأنشطة (مكتمل/تم تخطيه)

#### 💭 الذاكرة
- عرض سجل جميع المحادثات
- تتبع التفاعلات

#### 🤖 توصيات الذكاء الصناعي
- ترشيح كتب للطفل
- ترشيح دورات للوالدين
- اقتراح تمارين للطفل
- اقتراح أماكن فسح

## 🔧 الإعدادات المتقدمة

### تغيير المنطقة الزمنية

في ملف `.env`:

```env
TIMEZONE=Africa/Cairo
```

المناطق المتاحة: `Africa/Cairo`, `Asia/Riyadh`, `Asia/Dubai`, إلخ.

### تغيير مزود الذكاء الصناعي

```env
# للاستخدام مع OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key

# أو للاستخدام مع Anthropic Claude
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key
```

### تخصيص الرسائل

يمكنك تعديل الرسائل والنصائح من خلال ملف:
`services/ai-service.js`

## 📡 API Endpoints

النظام يوفر REST API كامل:

### Child Info
- `GET /api/child` - جلب معلومات الطفل
- `POST /api/child` - حفظ/تحديث معلومات الطفل

### Parent Info
- `GET /api/parents` - جلب جميع الوالدين
- `GET /api/parent/:type` - جلب والد محدد (father/mother)
- `POST /api/parent` - حفظ/تحديث معلومات والد

### Memory & Interactions
- `GET /api/memory` - جلب الذاكرة
- `GET /api/interactions` - جلب التفاعلات

### Schedules
- `GET /api/schedules` - جلب الجدولات
- `PUT /api/schedules/:id` - تحديث جدولة
- `POST /api/schedules` - إضافة جدولة
- `DELETE /api/schedules/:id` - حذف جدولة

### WhatsApp
- `GET /api/whatsapp/status` - حالة الاتصال
- `POST /api/whatsapp/send` - إرسال رسالة فورية

### Weather
- `GET /api/weather` - جلب حالة الطقس

### AI
- `POST /api/ai/recommend` - توليد توصيات

## 🗄️ قاعدة البيانات

النظام يستخدم SQLite بالجداول التالية:

- **child_info**: معلومات الطفل
- **parent_info**: معلومات الوالدين
- **memory**: ذاكرة المحادثات
- **measurements**: القياسات الدورية
- **activities**: الأنشطة والتوصيات
- **schedules**: الجدولة
- **interactions**: التفاعلات

## 🔐 الأمان

- جميع البيانات محفوظة محلياً
- لا يتم إرسال البيانات لأي خوادم خارجية (إلا لـ AI APIs)
- ملف `.env` محمي ولا يتم رفعه إلى Git
- اتصال واتساب مشفر من طرف إلى طرف

## 🐛 حل المشاكل

### مشكلة: لا يظهر رمز QR

**الحل**:
- تأكد من تثبيت جميع المكتبات: `npm install`
- احذف مجلد `.wwebjs_auth` وحاول مرة أخرى

### مشكلة: الرسائل لا تُرسل

**الحل**:
- تحقق من حالة واتساب في لوحة التحكم
- تأكد من صحة أرقام الهواتف المُدخلة
- تحقق من اتصال الإنترنت

### مشكلة: الذكاء الصناعي لا يرد

**الحل**:
- تحقق من صحة مفتاح API في ملف `.env`
- تأكد من وجود رصيد كافٍ في حساب API
- راجع الأخطاء في console

### مشكلة: الطقس لا يظهر

**الحل**:
- أضف مفتاح API من OpenWeatherMap
- تحقق من اسم المدينة في `.env`

## 📝 الترخيص

MIT License - يمكنك استخدام المشروع بحرية

## 🤝 المساهمة

المساهمات مرحب بها! يرجى:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📞 الدعم

للدعم أو الاستفسارات، يرجى:
- فتح Issue في GitHub
- التواصل عبر البريد الإلكتروني

## 🙏 شكر خاص

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - للتكامل مع واتساب
- [OpenAI](https://openai.com) - للذكاء الصناعي
- [Anthropic](https://anthropic.com) - لـ Claude AI
- [OpenWeatherMap](https://openweathermap.org) - لبيانات الطقس

---

صُنع بـ ❤️ من أجل الآباء والأمهات

</div>

---

# English Version

## Overview

An intelligent and comprehensive system for tracking child growth and providing parenting support. Uses AI to deliver personalized advice and daily support to parents through automatic WhatsApp messages.

## Key Features

- 🤖 Advanced AI integration (OpenAI GPT-4 or Anthropic Claude)
- 📱 Automated WhatsApp messaging
- 📊 Comprehensive Arabic dashboard
- 💾 Smart memory system
- ⏰ Flexible scheduling
- 🌤️ Weather integration
- 📚 Personalized recommendations
- 📈 Growth tracking
- 🎯 Activity management

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npm run init-db

# Start server
npm start

# Open browser at http://localhost:3000
```

## Documentation

See the Arabic section above for detailed documentation.

## License

MIT License

---

**Made with ❤️ for parents everywhere**
