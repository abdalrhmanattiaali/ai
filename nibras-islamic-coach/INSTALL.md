# 🚀 دليل التثبيت السريع - نبراس المؤمنين

**✅ بدون MongoDB - بدون Redis - فقط ملف SQLite واحد!**

---

## ⚡ التثبيت (دقيقتان فقط!)

### 1. تثبيت المكتبات

```bash
cd nibras-islamic-coach
npm install
```

### 2. إعداد البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل الملف وإضافة API Keys
nano .env
```

**أضف فقط:**
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxx    # من console.anthropic.com
OPENAI_API_KEY=sk-xxxxxx           # من platform.openai.com
```

### 3. التشغيل!

```bash
npm start
```

**هذا كل شيء!** ✅

- سيتم إنشاء `data/nibras.db` تلقائياً
- ❌ لا حاجة لـ MongoDB
- ❌ لا حاجة لـ Redis

---

## 📱 ربط الواتساب

1. سيظهر QR Code في Terminal
2. افتح الواتساب → الإعدادات → الأجهزة المرتبطة
3. امسح QR Code
4. انتظر رسالة "✅ بوت الواتساب جاهز!"

---

## 👤 إضافة مستخدم تجريبي

```bash
# طريقة 1: عبر سكريبت
node scripts/create-admin-user.js

# طريقة 2: عبر API
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد",
    "phone": "+201234567890",
    "profile": {
      "level": "متوسط",
      "goals": ["المحافظة على الفجر"]
    }
  }'
```

---

## 🧪 اختبار

```bash
# 1. تحقق من تشغيل السيرفر
curl http://localhost:3000

# 2. أرسل "مساعدة" من رقمك للبوت
```

---

## 📊 قاعدة البيانات

### المكان:
```
data/nibras.db  ← ملف واحد فقط!
```

### عرض البيانات:
```bash
sqlite3 data/nibras.db
.tables
SELECT * FROM users;
.exit
```

### Backup:
```bash
cp data/nibras.db backups/backup_$(date +%Y%m%d).db
```

---

## 🆘 مشاكل شائعة

### "Cannot find module 'better-sqlite3'"
```bash
npm install
```

### "Invalid API Key"
- افتح `.env`
- تأكد من صحة المفاتيح من:
  - https://console.anthropic.com/
  - https://platform.openai.com/

### "QR Code لا يظهر"
```bash
rm -rf whatsapp-session .wwebjs_auth
npm start
```

---

## ✅ Checklist

- [ ] `npm install` نجح
- [ ] `.env` معبأ بـ API Keys
- [ ] `npm start` يعمل
- [ ] QR Code ممسوح
- [ ] مستخدم تجريبي مضاف
- [ ] اختبار رسالة واحدة

---

**🌙 جاهز! استمتع بالمشروع**

للمزيد:
- [README.md](README.md) - الوثائق الكاملة
- [QUICKSTART_SQLITE.md](QUICKSTART_SQLITE.md) - دليل سريع
- [API.md](API.md) - وثائق API
