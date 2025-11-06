# 🎛️ لوحة التحكم الإدارية - دليل الاستخدام السريع

## 🚀 البدء السريع

### 1. تشغيل النظام بالكامل

```bash
# تشغيل جميع الخدمات (Python + Node.js + Admin)
chmod +x scripts/start-all.sh scripts/stop-all.sh
./scripts/start-all.sh
```

### 2. الوصول إلى لوحة التحكم

افتح المتصفح واذهب إلى:
```
http://localhost:5010
```

### 3. تسجيل الدخول

```
Username: admin
Password: admin123
```

**⚠️ مهم: غيّر كلمة المرور فوراً بعد أول تسجيل دخول!**

---

## 📋 المميزات الرئيسية

### ✅ ما يمكنك فعله من لوحة التحكم:

#### 1. إدارة الإعدادات (Settings)
- ✅ تعديل ERPNext URL و API Keys
- ✅ تعديل ClickUp Access Token و List IDs
- ✅ تعديل OpenAI API Key
- ✅ تعديل إعدادات WhatsApp
- ✅ إنشاء إعدادات مخصصة جديدة
- ✅ جميع الإعدادات محفوظة في قاعدة البيانات
- ✅ لا حاجة لتعديل ملفات .env

#### 2. إدارة الإشعارات (Notifications)
- ✅ إنشاء إشعارات مخصصة
- ✅ تعديل قوالب الرسائل
- ✅ تحديد المستقبلين
- ✅ جدولة الإشعارات (Cron)
- ✅ تفعيل/إيقاف الإشعارات
- ✅ معاينة الرسائل قبل الإرسال

#### 3. إدارة المهام المجدولة (Cron Jobs)
- ✅ عرض جميع المهام المجدولة
- ✅ تفعيل/إيقاف أي مهمة
- ✅ معرفة آخر وقت تشغيل
- ✅ معرفة الوقت القادم للتشغيل
- ✅ التحكم الكامل دون تعديل الكود

#### 4. إدارة WhatsApp
- ✅ عرض QR Code في الوقت الفعلي
- ✅ تفعيل WhatsApp من اللوحة مباشرة
- ✅ معرفة حالة الاتصال
- ✅ رقم الهاتف المتصل
- ✅ إعادة تفعيل بكبسة زر
- ✅ اختبار إرسال رسائل

#### 5. مراقبة النظام (System Monitor)
- ✅ استخدام CPU, RAM, Disk
- ✅ حالة جميع الخدمات
- ✅ إحصائيات قاعدة البيانات
- ✅ رسوم بيانية فورية
- ✅ تنبيهات عند وجود مشاكل

#### 6. سجل العمليات (Audit Log)
- ✅ تتبع كل العمليات
- ✅ من قام بالتغيير ومتى
- ✅ فلترة حسب النوع
- ✅ تصدير التقارير

---

## 🎨 مثال: إضافة إشعار مخصص

### من لوحة التحكم:

1. اذهب إلى **Notifications**
2. اضغط **إضافة إشعار جديد**
3. املأ البيانات:

```
الاسم: إشعار نهاية الأسبوع
النوع: Scheduled
الجدولة: 0 17 * * 5   (كل جمعة الساعة 5 مساءً)
قالب الرسالة:
  📅 ملخص الأسبوع

  عمل رائع هذا الأسبوع! 🎉
  المهام المكتملة: {completed_tasks}
  نتمنى لكم عطلة نهاية أسبوع سعيدة! 🌴

المستقبلون:
  - المجموعة الرئيسية

الشروط:
  - فقط إذا كان هناك مهام مكتملة
```

4. احفظ ✅

**والآن الإشعار سيُرسل تلقائياً كل جمعة!**

---

## 🔧 مثال: تغيير OpenAI API Key

### الطريقة القديمة ❌:
```bash
nano nodejs-backend/.env
# تعديل OPENAI_API_KEY
# إعادة تشغيل الخدمة
sudo systemctl restart clickup-nodejs
```

### الطريقة الجديدة ✅:
1. اذهب إلى **Settings**
2. اختر تبويب **OpenAI**
3. عدّل `api_key`
4. احفظ ✅

**التغيير يسري فوراً دون إعادة تشغيل!**

---

## 📱 مثال: تفعيل WhatsApp

### من لوحة التحكم:

1. اذهب إلى **WhatsApp**
2. اضغط **Activate WhatsApp**
3. انتظر ظهور QR Code
4. امسح الكود بتطبيق WhatsApp على هاتفك
5. ✅ تم! ستظهر حالة "Connected"

---

## 🎯 مثال: تعطيل إشعار معين

لنفترض أنك تريد إيقاف الرسائل الصباحية مؤقتاً:

1. اذهب إلى **Notifications**
2. ابحث عن "Morning Inspiration"
3. اضغط على زر **Disable**
4. ✅ تم إيقاف الإشعار

لإعادة تفعيله، اضغط **Enable**

---

## 📊 API Endpoints (للمطورين)

### مثال: الحصول على الإعدادات

```bash
# تسجيل الدخول
curl -X POST http://localhost:5010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# الحصول على جميع الإعدادات
curl http://localhost:5010/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# تحديث إعداد
curl -X PUT http://localhost:5010/api/settings/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "new_value"}'
```

---

## 🔒 الأمان

### تغيير كلمة المرور

1. سجل دخول
2. اذهب إلى **Profile** → **Change Password**
3. أدخل:
   - كلمة المرور الحالية
   - كلمة المرور الجديدة
   - تأكيد كلمة المرور
4. احفظ ✅

### إنشاء مستخدم جديد

```bash
# عبر Python
cd admin-api
python3

>>> import sqlite3, hashlib
>>> conn = sqlite3.connect('admin.db')
>>> c = conn.cursor()
>>> username = 'manager'
>>> password = 'secure_password'
>>> hash = hashlib.sha256(password.encode()).hexdigest()
>>> c.execute("INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)",
...           (username, hash, 'manager@example.com', 'admin'))
>>> conn.commit()
```

---

## 🚦 حالة الخدمات

### التحقق من الخدمات:

```bash
# Python Backend (Port 5005)
curl http://localhost:5005/health

# Node.js Backend (Port 5014)
curl http://localhost:5014/health

# Admin API (Port 5010)
curl http://localhost:5010/api/system/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### عرض السجلات:

```bash
# Python Backend
tail -f logs/python-backend.log

# Node.js Backend
tail -f logs/nodejs-backend.log

# Admin API
tail -f logs/admin-api.log
```

---

## 🛑 إيقاف النظام

```bash
# إيقاف جميع الخدمات
./scripts/stop-all.sh
```

---

## 🔄 إعادة التشغيل

```bash
# إيقاف ثم تشغيل
./scripts/stop-all.sh
./scripts/start-all.sh
```

---

## 📂 هيكل الملفات

```
clickup-integration-system/
├── admin-api/                # Admin API Backend
│   ├── admin_server.py      # Main server
│   ├── admin.db             # Settings database
│   └── requirements.txt     # Python dependencies
│
├── admin-dashboard/         # React Dashboard
│   ├── src/                 # Source code
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Build config
│
├── python-backend/          # ERPNext Webhooks Handler
├── nodejs-backend/          # ClickUp + WhatsApp Bot
│
└── scripts/
    ├── start-all.sh        # Start everything
    └── stop-all.sh         # Stop everything
```

---

## 🎓 أمثلة عملية

### 1. إضافة قائمة ClickUp جديدة

```bash
# في لوحة التحكم → Settings → ClickUp
# أضف:
Key: new_list_id
Value: 123456789
Description: قائمة المهام الخاصة
```

### 2. تخصيص رسالة WhatsApp

```bash
# في لوحة التحكم → Notifications
# عدّل قالب الرسالة:

السابق:
  صباح الخير! {message}

الجديد:
  🌅 صباح الخير يا {username}!

  {message}

  تمنياتنا بيوم مثمر! 💪
```

### 3. إنشاء تقرير مخصص

```bash
# في Notifications → Create New

Name: تقرير أداء الفريق
Type: scheduled
Schedule: 0 14 * * 1-5  # كل يوم عمل 2 ظهراً
Message:
  📊 تقرير الأداء اليومي

  الفريق: {team_name}
  المهام المكتملة: {completed_count}
  المهام المتبقية: {pending_count}
  معدل الإنجاز: {completion_rate}%
```

---

## 🆘 المساعدة والدعم

### مشكلة شائعة: QR Code لا يظهر

**الحل:**
1. تأكد من تشغيل Node.js backend
2. تحقق من Socket.IO connection في Console
3. اذهب إلى WhatsApp → Reconnect
4. إذا استمرت المشكلة:
```bash
./scripts/stop-all.sh
rm -rf nodejs-backend/.wwebjs_auth
./scripts/start-all.sh
```

### مشكلة: الإعدادات لا تحفظ

**الحل:**
1. تحقق من صلاحيات قاعدة البيانات
2. راجع Audit Log
3. تحقق من السجلات:
```bash
tail -f logs/admin-api.log
```

---

## 📚 الوثائق الكاملة

- 📖 [Admin Dashboard Documentation](docs/ADMIN_DASHBOARD.md)
- 📘 [API Reference](docs/ADMIN_DASHBOARD.md#-api-endpoints)
- 🏗️ [Database Schema](docs/ADMIN_DASHBOARD.md#-قاعدة-البيانات-الإدارية)

---

## ✨ المميزات القادمة

- [ ] Mobile App
- [ ] تعديل AI Prompts من اللوحة
- [ ] تقارير مخصصة
- [ ] نسخ احتياطي تلقائي
- [ ] Multi-language support
- [ ] Dark Mode
- [ ] تصدير/استيراد الإعدادات

---

**تم بنجاح!** 🎉

الآن لديك لوحة تحكم كاملة لإدارة كل شيء من مكان واحد!

**لا حاجة لتعديل الكود أو ملفات الإعداد يدوياً بعد الآن** ✨
