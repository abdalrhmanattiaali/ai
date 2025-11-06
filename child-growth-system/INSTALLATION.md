# 🚀 دليل التثبيت الشامل - نظام رفيق النمو

## المتطلبات الأساسية

يجب تثبيت البرامج التالية على جهازك:

### 1. Node.js (الإصدار 20 أو أحدث)
```bash
# التحقق من التثبيت
node --version
npm --version
```

**للتثبيت:**
- Windows/Mac: حمل من https://nodejs.org/
- Linux:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. MongoDB (الإصدار 7 أو أحدث)

**الخيار 1: تثبيت محلي**
- Windows: https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**الخيار 2: استخدام MongoDB Atlas (Cloud - موصى به)**
1. اذهب إلى: https://www.mongodb.com/cloud/atlas
2. أنشئ حساب مجاني
3. أنشئ Cluster جديد
4. احصل على Connection String

### 3. Git
```bash
git --version
```

---

## 📥 خطوة 1: استنساخ المشروع

```bash
# إذا كان المشروع على GitHub
git clone https://github.com/your-repo/ai.git
cd ai

# الانتقال للـ branch الصحيح
git checkout claude/child-growth-whatsapp-system-011CUs8knoDTjjL598Vm21dy

# الدخول لمجلد المشروع
cd child-growth-system
```

---

## ⚙️ خطوة 2: إعداد Backend

### 2.1 الدخول لمجلد Backend
```bash
cd backend
```

### 2.2 تثبيت Dependencies
```bash
npm install
```

**إذا ظهرت أخطاء في التثبيت:**
```bash
# حاول:
npm install --legacy-peer-deps

# أو
npm cache clean --force
npm install
```

### 2.3 إنشاء ملف .env
```bash
# نسخ ملف المثال
cp .env.example .env

# أو إنشاء الملف يدوياً
touch .env
```

### 2.4 تعديل ملف .env
افتح ملف `.env` وعدل المتغيرات:

```env
# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/child-growth-system
# أو إذا استخدمت MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/child-growth-system

# JWT
JWT_SECRET=my-super-secret-key-change-this-123456
JWT_EXPIRE=30d

# OpenAI (احصل على API Key من: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-api-key-here

# Weather API (اختياري - من: https://openweathermap.org/api)
OPENWEATHER_API_KEY=your-weather-api-key

# Redis (اختياري)
REDIS_URL=redis://localhost:6379
```

### 2.5 إنشاء المجلدات المطلوبة
```bash
mkdir -p whatsapp-sessions uploads logs
```

---

## 🎨 خطوة 3: إعداد Frontend

### 3.1 فتح Terminal جديد وانتقل لمجلد Frontend
```bash
cd child-growth-system/frontend
```

### 3.2 تثبيت Dependencies
```bash
npm install
```

**إذا ظهرت أخطاء:**
```bash
npm install --legacy-peer-deps
```

### 3.3 إنشاء ملف .env.local
```bash
touch .env.local
```

### 3.4 تعديل ملف .env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## ▶️ خطوة 4: تشغيل النظام

### 4.1 تأكد من تشغيل MongoDB
```bash
# إذا كان محلي:
sudo systemctl status mongod

# أو
mongod --version
```

### 4.2 تشغيل Backend
في Terminal الأول:
```bash
cd child-growth-system/backend
npm run dev
```

**يجب أن ترى:**
```
╔═══════════════════════════════════════════════╗
║                                               ║
║     🌟 رفيق النمو - Child Growth System      ║
║                                               ║
║     Server running on port 5000               ║
║     Environment: development                  ║
║     Frontend: http://localhost:3000           ║
║                                               ║
╚═══════════════════════════════════════════════╝
✅ MongoDB Connected: ...
```

### 4.3 تشغيل Frontend
في Terminal الثاني:
```bash
cd child-growth-system/frontend
npm run dev
```

**يجب أن ترى:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

---

## 🎯 خطوة 5: الوصول للنظام

افتح المتصفح واذهب إلى:

### الصفحة الرئيسية
```
http://localhost:3000
```

### إنشاء حساب
```
http://localhost:3000/register
```

**أدخل:**
- اسم المستخدم: `admin`
- البريد الإلكتروني: `admin@example.com`
- كلمة المرور: `123456`

### تسجيل الدخول
```
http://localhost:3000/login
```

### Dashboard
```
http://localhost:3000/dashboard
```

### ربط WhatsApp
```
http://localhost:3000/dashboard/whatsapp
```

---

## 📱 خطوة 6: ربط WhatsApp

1. اذهب إلى: `http://localhost:3000/dashboard/whatsapp`
2. اضغط على زر "بدء الاتصال"
3. انتظر ظهور QR Code
4. افتح WhatsApp على هاتفك
5. اذهب إلى: **الإعدادات** ← **الأجهزة المرتبطة** ← **ربط جهاز**
6. امسح QR Code
7. ستتغير الحالة إلى "متصل" ✅

---

## 🧪 خطوة 7: اختبار النظام

### 7.1 اختبار API
```bash
# Test Health
curl http://localhost:5000/health

# Test Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'
```

### 7.2 اختبار WhatsApp
1. بعد الربط، جرب إرسال رسالة من الـ Dashboard
2. تحقق من استقبال الرسائل

---

## 🔧 استكشاف الأخطاء

### مشكلة: Backend لا يعمل

**السبب: MongoDB غير متصل**
```bash
# تحقق من MongoDB
sudo systemctl status mongod

# إعادة التشغيل
sudo systemctl restart mongod

# أو استخدم MongoDB Atlas بدلاً منه
```

**السبب: Port مستخدم**
```bash
# البحث عن العملية
lsof -i :5000

# إيقاف العملية
kill -9 <PID>
```

### مشكلة: Frontend لا يعمل

**السبب: Port مستخدم**
```bash
# تغيير Port في package.json:
"dev": "next dev -p 3001"
```

**السبب: Dependencies**
```bash
# إعادة التثبيت
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### مشكلة: WhatsApp لا يتصل

**الحل:**
1. تأكد من عدم وجود جلسة قديمة:
```bash
rm -rf backend/whatsapp-sessions/*
```

2. أعد تشغيل Backend
3. حاول الربط مرة أخرى

### مشكلة: QR Code لا يظهر

**الحل:**
1. افتح Console في المتصفح (F12)
2. تحقق من Socket.io connection
3. تأكد من تشغيل Backend
4. تحقق من CORS settings

---

## 📊 التحقق من النجاح

### ✅ Backend يعمل إذا رأيت:
- `✅ MongoDB Connected`
- `Server running on port 5000`
- لا توجد أخطاء في Console

### ✅ Frontend يعمل إذا:
- الصفحة تفتح على `localhost:3000`
- يمكنك التنقل بين الصفحات
- لا توجد أخطاء في Console

### ✅ WhatsApp متصل إذا:
- الحالة تعرض "متصل" 🟢
- رقم الهاتف يظهر
- يمكنك إرسال رسائل

---

## 🚀 الخطوات التالية

بعد التثبيت الناجح:

1. **إضافة أسرة**: Dashboard → إدارة الأسر
2. **إضافة طفل**: Dashboard → إدارة الأطفال
3. **إضافة والد**: Dashboard → إدارة المستقبلين
4. **إرسال رسالة تجريبية**: Dashboard → WhatsApp
5. **جدولة رسالة**: Dashboard → الجدولة

---

## 📞 الحصول على المساعدة

إذا واجهت أي مشكلة:

1. تحقق من Logs:
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs (في terminal)
```

2. تحقق من MongoDB:
```bash
mongo
> show dbs
> use child-growth-system
> show collections
```

3. تحقق من Environment Variables:
```bash
cd backend
cat .env
```

---

## 🎉 تهانينا!

إذا وصلت لهنا، النظام يعمل بنجاح! 🚀

يمكنك الآن:
- ✅ إدارة الأسر والأطفال
- ✅ إرسال رسائل WhatsApp
- ✅ استخدام الذكاء الاصطناعي
- ✅ جدولة رسائل تلقائية
- ✅ متابعة نمو الأطفال

**استمتع باستخدام رفيق النمو! 🌟**
