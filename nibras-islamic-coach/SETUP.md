# 📘 دليل التثبيت والتشغيل - نبراس المؤمنين

دليل شامل لتثبيت وتشغيل نظام نبراس المؤمنين - الكوتش الديني الذكي.

---

## 📋 المتطلبات الأساسية

### 1. البرمجيات المطلوبة

```bash
# Node.js (الإصدار 18 أو أحدث)
node --version  # يجب أن يكون v18.x أو أعلى

# MongoDB
mongod --version  # يجب أن يكون 4.4 أو أعلى

# Redis (اختياري - للتحسين)
redis-server --version
```

### 2. حسابات API المطلوبة

#### أ) Claude AI (Anthropic)
1. اذهب إلى: https://console.anthropic.com/
2. سجل حساب جديد
3. اذهب إلى "API Keys"
4. أنشئ مفتاح API جديد
5. احفظ المفتاح (ستحتاجه في ملف .env)

#### ب) ChatGPT (OpenAI)
1. اذهب إلى: https://platform.openai.com/
2. سجل حساب جديد
3. اذهب إلى "API Keys"
4. أنشئ مفتاح API جديد
5. احفظ المفتاح

#### ج) رقم واتساب
- رقم واتساب عادي (ليس Business API)
- الواتساب يجب أن يكون نشطاً على الهاتف
- ستحتاج لمسح QR Code

---

## 🚀 خطوات التثبيت

### الخطوة 1: تنزيل المشروع

```bash
cd /home/user/ai/nibras-islamic-coach
```

### الخطوة 2: تثبيت المكتبات

```bash
npm install
```

إذا ظهرت أخطاء في التثبيت، جرب:

```bash
npm install --force
# أو
npm install --legacy-peer-deps
```

### الخطوة 3: إعداد ملف البيئة (.env)

```bash
# نسخ ملف المثال
cp .env.example .env

# تحرير الملف
nano .env
```

املأ القيم التالية:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/nibras_coach

# AI APIs (مهم جداً!)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Prayer Times
ALADHAN_API_URL=https://api.aladhan.com/v1

# JWT (اختر كلمة سر قوية)
JWT_SECRET=your_very_strong_secret_key_here_123456789

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp-session

# Settings
DEFAULT_TIMEZONE=Africa/Cairo
DEFAULT_LANGUAGE=ar
```

**⚠️ مهم جداً:**
- استبدل `ANTHROPIC_API_KEY` بمفتاح Claude الحقيقي
- استبدل `OPENAI_API_KEY` بمفتاح ChatGPT الحقيقي
- غيّر `JWT_SECRET` إلى كلمة سر قوية

### الخطوة 4: تشغيل MongoDB

#### في لينكس/Mac:

```bash
# بدء MongoDB
sudo systemctl start mongod

# التأكد من التشغيل
sudo systemctl status mongod
```

#### في Windows:

```bash
# بدء MongoDB
net start MongoDB
```

#### باستخدام Docker:

```bash
docker run -d -p 27017:27017 --name nibras-mongo mongo:latest
```

### الخطوة 5: تشغيل التطبيق

#### Development Mode:

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

---

## 📱 ربط الواتساب

### الخطوات:

1. شغل التطبيق:
```bash
npm start
```

2. انتظر حتى يظهر QR Code في الـ Terminal

3. افتح الواتساب على هاتفك:
   - اذهب إلى: **الإعدادات** → **الأجهزة المرتبطة**
   - اضغط **ربط جهاز**

4. امسح الـ QR Code

5. انتظر حتى تظهر رسالة:
   ```
   ✅ بوت الواتساب جاهز!
   ```

**ملاحظات:**
- QR Code يتجدد كل 30 ثانية
- إذا انتهى الوقت، سيظهر QR جديد
- الجلسة تُحفظ في المجلد `whatsapp-session/`
- لن تحتاج لمسح QR مرة أخرى إلا إذا حذفت المجلد

---

## 👥 إضافة المستخدمين

### طريقة 1: عبر API

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phone": "+201234567890",
    "profile": {
      "level": "متوسط",
      "goals": ["المحافظة على الفجر", "ختم القرآن شهرياً"]
    },
    "location": {
      "city": "Cairo",
      "country": "Egypt"
    }
  }'
```

### طريقة 2: عبر MongoDB مباشرة

```bash
# الدخول إلى MongoDB Shell
mongosh

# استخدام قاعدة البيانات
use nibras_coach

# إضافة مستخدم
db.users.insertOne({
  name: "أحمد محمد",
  phone: "+201234567890",
  status: "active",
  profile: {
    level: "متوسط",
    goals: ["المحافظة على الفجر"]
  },
  location: {
    city: "Cairo",
    country: "Egypt"
  },
  stats: {
    currentStreak: 0,
    totalPoints: 0,
    level: 1
  },
  createdAt: new Date()
})
```

### طريقة 3: استخدام Postman أو أي API Client

1. افتح Postman
2. أنشئ طلب جديد:
   - **Method:** POST
   - **URL:** `http://localhost:3000/api/users`
   - **Headers:** `Content-Type: application/json`
   - **Body (raw JSON):**
   ```json
   {
     "name": "محمد علي",
     "phone": "+201234567890",
     "profile": {
       "level": "متوسط",
       "goals": ["قيام الليل", "حفظ القرآن"]
     },
     "location": {
       "city": "Alexandria",
       "country": "Egypt"
     }
   }
   ```

---

## 🧪 اختبار النظام

### 1. التحقق من السيرفر

```bash
curl http://localhost:3000
```

يجب أن يعود:
```json
{
  "message": "🌙 نبراس المؤمنين - Islamic AI Coach",
  "version": "1.0.0",
  "status": "running"
}
```

### 2. التحقق من الواتساب

أرسل رسالة "مساعدة" من رقمك المسجل للبوت.

يجب أن يرد البوت بقائمة الأوامر.

### 3. اختبار أوقات الصلاة

```bash
curl "http://localhost:3000/api/prayer-times?city=Cairo&country=Egypt"
```

### 4. اختبار الذكاء الاصطناعي

```bash
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "ما هو فضل صلاة الفجر؟",
    "level": "متوسط"
  }'
```

---

## 📊 مراقبة النظام

### عرض اللوجات (Logs)

```bash
# عرض اللوجات المباشرة
npm run dev

# حفظ اللوجات في ملف
npm start > logs/app.log 2>&1
```

### مراقبة قاعدة البيانات

```bash
mongosh

use nibras_coach

# عدد المستخدمين
db.users.countDocuments()

# آخر الصلوات المسجلة
db.prayers.find().sort({date: -1}).limit(10).pretty()

# إحصائيات سريعة
db.users.aggregate([
  { $group: { _id: null, totalPoints: { $sum: "$stats.totalPoints" } } }
])
```

### Health Check

```bash
curl http://localhost:3000/health
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: "Cannot connect to MongoDB"

**الحل:**

```bash
# تحقق من تشغيل MongoDB
sudo systemctl status mongod

# إعادة تشغيل
sudo systemctl restart mongod

# التأكد من البورت
netstat -tuln | grep 27017
```

### المشكلة: "QR Code لا يظهر"

**الحل:**

1. تأكد من تثبيت المكتبات بشكل صحيح:
```bash
npm install whatsapp-web.js qrcode-terminal
```

2. احذف المجلد القديم:
```bash
rm -rf .wwebjs_auth whatsapp-session
```

3. أعد تشغيل التطبيق

### المشكلة: "API Key invalid" (Claude أو ChatGPT)

**الحل:**

1. تأكد من نسخ المفتاح بشكل صحيح في `.env`
2. تأكد من عدم وجود مسافات في البداية أو النهاية
3. تحقق من صلاحية المفتاح في لوحة التحكم الخاصة بالموقع
4. جرب إنشاء مفتاح جديد

### المشكلة: "WhatsApp disconnected"

**الحل:**

1. تأكد من أن هاتفك متصل بالإنترنت
2. افتح الواتساب على هاتفك
3. اذهب إلى الأجهزة المرتبطة وتأكد من الاتصال
4. أعد تشغيل التطبيق

---

## 🔄 التحديثات والصيانة

### تحديث المكتبات

```bash
npm update
```

### تنظيف قاعدة البيانات

```bash
mongosh

use nibras_coach

# حذف بيانات قديمة (مثلاً: أقدم من 6 أشهر)
db.prayers.deleteMany({
  date: { $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
})
```

### Backup قاعدة البيانات

```bash
# عمل Backup
mongodump --db nibras_coach --out ./backups/$(date +%Y%m%d)

# استرجاع Backup
mongorestore --db nibras_coach ./backups/20240115/nibras_coach
```

---

## 🚀 النشر على السيرفر (Production)

### استخدام PM2 (مستحسن)

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start src/server.js --name nibras-coach

# حفظ الإعدادات
pm2 save

# تشغيل تلقائي عند إعادة التشغيل
pm2 startup

# مراقبة
pm2 monit

# اللوجات
pm2 logs nibras-coach

# إعادة تشغيل
pm2 restart nibras-coach
```

### استخدام Docker

```bash
# إنشاء Docker Image (قريباً - سيتم إضافة Dockerfile)
docker build -t nibras-coach .

# تشغيل Container
docker run -d -p 3000:3000 --name nibras nibras-coach
```

---

## 📞 الدعم والمساعدة

### موارد مفيدة:

- **الوثائق الكاملة:** [README.md](README.md)
- **API Documentation:** قريباً
- **أسئلة شائعة:** قريباً

### الإبلاغ عن مشكلة:

إذا واجهت مشكلة:
1. تحقق من اللوجات (`pm2 logs` أو Terminal)
2. راجع ملف `.env`
3. تأكد من تشغيل كل الخدمات (MongoDB, Redis)
4. افتح Issue على GitHub

---

## ✅ Checklist قبل الإطلاق

- [ ] MongoDB يعمل
- [ ] ملف `.env` معبأ بشكل صحيح
- [ ] API Keys صالحة (Claude + ChatGPT)
- [ ] الواتساب متصل (QR Code ممسوح)
- [ ] تم إضافة مستخدم تجريبي
- [ ] تم اختبار إرسال رسالة
- [ ] تم اختبار تذكير الصلاة
- [ ] الـ Health Check يعمل
- [ ] PM2 مثبت ويعمل (Production)

---

**تم بناء هذا النظام بحب في خدمة الإسلام والمسلمين 🌙**

**جزاكم الله خيراً**
