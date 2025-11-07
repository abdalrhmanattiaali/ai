# ⚡ Quick Start - نبراس المؤمنين

دليل سريع للبدء خلال 5 دقائق!

---

## 🚀 البدء السريع

### 1. التثبيت (دقيقة واحدة)

```bash
cd /home/user/ai/nibras-islamic-coach
npm install
```

### 2. إعداد البيئة (دقيقتان)

```bash
# نسخ ملف المثال
cp .env.example .env

# تحرير الملف
nano .env
```

**أهم شيء: أضف API Keys!**

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxx    # من console.anthropic.com
OPENAI_API_KEY=sk-xxxxxx           # من platform.openai.com
```

### 3. تشغيل MongoDB

```bash
# Linux/Mac
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name nibras-mongo mongo
```

### 4. تشغيل التطبيق

```bash
npm start
```

### 5. مسح QR Code للواتساب

- سيظهر QR Code في Terminal
- افتح واتساب → الإعدادات → الأجهزة المرتبطة
- امسح الكود

### 6. إضافة مستخدم تجريبي

في terminal جديد:

```bash
node scripts/create-admin-user.js
```

أو عبر API:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد",
    "phone": "+201234567890"
  }'
```

### 7. اختبار

أرسل "مساعدة" من رقمك للبوت!

---

## 🎯 أوامر مفيدة

```bash
# تشغيل Development
npm run dev

# ملء المحتوى الإسلامي
node scripts/seed-content.js

# إنشاء مستخدم
node scripts/create-admin-user.js

# مراقبة اللوجات
npm start | tee logs/app.log
```

---

## ✅ Checklist سريع

- [ ] Node.js مثبت (v18+)
- [ ] MongoDB يعمل
- [ ] ملف `.env` معبأ بـ API Keys
- [ ] `npm install` نجح
- [ ] التطبيق يعمل (`npm start`)
- [ ] QR Code ممسوح
- [ ] مستخدم تجريبي مضاف
- [ ] اختبار رسالة واحدة

---

## 🆘 مشاكل شائعة

### "Cannot connect to MongoDB"
```bash
sudo systemctl start mongod
# أو
docker start nibras-mongo
```

### "Invalid API Key"
- تحقق من `.env`
- تأكد من صحة المفتاح من الموقع
- احذف المسافات

### "QR Code لا يظهر"
```bash
rm -rf whatsapp-session .wwebjs_auth
npm start
```

---

## 📚 المزيد

- [README.md](README.md) - شرح كامل
- [SETUP.md](SETUP.md) - دليل التثبيت المفصل
- [API.md](API.md) - وثائق الـ API

---

**🌙 جاهز! ابدأ رحلتك الروحانية الآن**
