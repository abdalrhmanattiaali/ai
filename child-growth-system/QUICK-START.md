# 🚀 البدء السريع - رفيق النمو

## بعد تنزيل المشروع

### 1️⃣ فك الضغط (إذا نزلت ZIP)
```bash
unzip ai-claude-child-growth-whatsapp-system*.zip
cd ai-*/child-growth-system
```

### 2️⃣ تثبيت Backend
```bash
cd backend

# تثبيت Dependencies
npm install

# إنشاء .env
cp .env.example .env
nano .env  # أو استخدم أي محرر نصوص

# أضف في .env:
# MONGODB_URI=mongodb://localhost:27017/child-growth-system
# JWT_SECRET=my-secret-key-12345
# OPENAI_API_KEY=sk-your-openai-key

# تشغيل
npm run dev
```

### 3️⃣ تثبيت Frontend (في terminal جديد)
```bash
cd frontend

# تثبيت Dependencies
npm install

# إنشاء .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# تشغيل
npm run dev
```

### 4️⃣ افتح المتصفح
```
http://localhost:3000
```

---

## ⚡ مثال سريع (نسخ ولصق)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
# عدل .env وأضف: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
```

**المتصفح:**
```
http://localhost:3000
```

---

## 🔑 الحصول على API Keys

### MongoDB (اختر أحد الخيارات):
**الخيار 1: MongoDB محلي**
```bash
# تثبيت وتشغيل MongoDB
sudo systemctl start mongod
# استخدم: mongodb://localhost:27017/child-growth-system
```

**الخيار 2: MongoDB Atlas (موصى به - مجاناً)**
1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. أنشئ حساب مجاني
3. أنشئ Cluster
4. اضغط "Connect" → "Connect your application"
5. انسخ Connection String
6. استخدمه في .env

### OpenAI API Key:
1. اذهب إلى: https://platform.openai.com/signup
2. سجل حساب جديد
3. اذهب إلى: https://platform.openai.com/api-keys
4. اضغط "Create new secret key"
5. انسخ المفتاح واستخدمه في .env

**ملاحظة:** تحتاج إضافة رصيد ($5 على الأقل) لاستخدام GPT-4

---

## ✅ تحقق من النجاح

### Backend جاهز ✅
```bash
curl http://localhost:5000/health
# يجب أن يرجع: {"status":"ok"}
```

### Frontend جاهز ✅
افتح: http://localhost:3000
يجب أن ترى الصفحة الرئيسية

### MongoDB متصل ✅
في terminal Backend، يجب أن ترى:
```
✅ MongoDB Connected: ...
```

---

## 🎯 الخطوات الأولى

1. **أنشئ حساب**: http://localhost:3000/register
2. **سجل دخول**: http://localhost:3000/login
3. **اربط WhatsApp**: Dashboard → ربط WhatsApp
4. **أضف أسرة**: Dashboard → إدارة الأسر
5. **ابدأ الاستخدام!** 🎉

---

## ❓ مشاكل شائعة

### "Cannot connect to MongoDB"
```bash
# تأكد من تشغيل MongoDB
sudo systemctl status mongod

# أو استخدم MongoDB Atlas
```

### "Port 5000 already in use"
```bash
# أوقف العملية المستخدمة للـ port
lsof -i :5000
kill -9 <PID>
```

### "npm install failed"
```bash
# جرب:
npm install --legacy-peer-deps
```

---

## 📚 المزيد من المعلومات

- **دليل التثبيت الكامل**: اقرأ `INSTALLATION.md`
- **التوثيق الشامل**: اقرأ `README.md`
- **المشاكل الشائعة**: راجع قسم "استكشاف الأخطاء" في INSTALLATION.md

---

## 🎉 كل شيء يعمل؟

رائع! الآن يمكنك:
- ✅ إضافة أسر وأطفال
- ✅ إرسال رسائل WhatsApp
- ✅ استخدام الذكاء الاصطناعي
- ✅ جدولة رسائل تلقائية
- ✅ متابعة نمو الأطفال

**استمتع باستخدام رفيق النمو! 🌟**
