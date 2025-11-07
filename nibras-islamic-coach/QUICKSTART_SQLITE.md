# ⚡ Quick Start - نبراس المؤمنين (SQLite النسخة)

**✅ بدون MongoDB - بدون Redis - فقط ملف واحد!**

---

## 🚀 البدء السريع (3 دقائق)

### 1. التثبيت (دقيقة واحدة)

```bash
cd /home/user/ai/nibras-islamic-coach
npm install
```

### 2. إعداد البيئة (30 ثانية)

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

### 3. تشغيل التطبيق مباشرة!

```bash
npm start
```

**هذا كل شيء!** ✅

- ❌ لا حاجة لتشغيل MongoDB
- ❌ لا حاجة لتشغيل Redis
- ✅ سيتم إنشاء ملف `data/nibras.db` تلقائياً!

### 4. مسح QR Code للواتساب

- سيظهر QR Code في Terminal
- افتح واتساب → الإعدادات → الأجهزة المرتبطة
- امسح الكود

### 5. إضافة مستخدم تجريبي

```bash
node scripts/create-admin-user.js
```

### 6. اختبار

أرسل "مساعدة" من رقمك للبوت!

---

## 📊 قاعدة البيانات

### المكان:
```
nibras-islamic-coach/
└── data/
    └── nibras.db          ← الملف الوحيد!
```

### Backup:
```bash
# نسخ الملف
cp data/nibras.db backups/nibras_backup_$(date +%Y%m%d).db
```

### استعادة Backup:
```bash
cp backups/nibras_backup_20240115.db data/nibras.db
```

### عرض البيانات:
```bash
# تثبيت sqlite3
sudo apt install sqlite3

# فتح قاعدة البيانات
sqlite3 data/nibras.db

# داخل sqlite3:
.tables                 # عرض الجداول
SELECT * FROM users;    # عرض المستخدمين
.exit                   # خروج
```

---

## ✅ Checklist سريع

- [ ] Node.js مثبت (v18+)
- [ ] ✅ ~~MongoDB~~ **غير مطلوب!**
- [ ] ✅ ~~Redis~~ **غير مطلوب!**
- [ ] ملف `.env` معبأ بـ API Keys
- [ ] `npm install` نجح
- [ ] التطبيق يعمل (`npm start`)
- [ ] QR Code ممسوح
- [ ] مستخدم تجريبي مضاف

---

## 🆘 مشاكل شائعة

### "Invalid API Key"
- تحقق من `.env`
- تأكد من صحة المفتاح
- احذف المسافات

### "QR Code لا يظهر"
```bash
rm -rf whatsapp-session .wwebjs_auth
npm start
```

### "Cannot find module 'better-sqlite3'"
```bash
npm install better-sqlite3
```

---

## 🎯 المميزات

✅ **بساطة**: لا حاجة لتشغيل خدمات خارجية
✅ **سرعة**: ملف واحد = أداء ممتاز
✅ **سهولة النقل**: انسخ مجلد `data/` وكل شيء معك
✅ **Backup سهل**: نسخ ملف واحد فقط

---

**🌙 جاهز! ابدأ الآن**

```bash
npm start
```

---

## 📚 المزيد

- [README.md](README.md) - شرح كامل
- [SETUP.md](SETUP.md) - دليل التثبيت المفصل (مع SQLite)
- [API.md](API.md) - وثائق الـ API
