# 🎛️ لوحة التحكم الإدارية - Admin Dashboard

## نظرة عامة

لوحة تحكم متكاملة لإدارة كامل نظام ClickUp Integration System من واجهة ويب واحدة.

---

## 🏗️ المكونات الرئيسية

### 1. Admin API (Python Flask)
**المنفذ**: 5010
**الملف**: `admin-api/admin_server.py`

#### المميزات:
✅ **Authentication System** - نظام تسجيل دخول بـ JWT
✅ **Settings Management** - إدارة جميع الإعدادات من قاعدة البيانات
✅ **API Keys Management** - إدارة ERPNext, ClickUp, OpenAI keys
✅ **Notifications Config** - إنشاء وتعديل الإشعارات
✅ **Cron Jobs Control** - تفعيل/إيقاف المهام المجدولة
✅ **WhatsApp QR Code** - عرض QR Code في الوقت الفعلي
✅ **System Monitoring** - مراقبة الموارد والخدمات
✅ **Audit Log** - تتبع كل العمليات
✅ **Socket.IO Support** - تحديثات فورية

---

### 2. Frontend Dashboard (React)
**المنفذ**: 3000 (dev) / served by Flask (production)
**المسار**: `admin-dashboard/`

#### الصفحات:
1. **Dashboard** - نظرة عامة على النظام
2. **Settings** - إدارة الإعدادات والـ API Keys
3. **Notifications** - إنشاء وتعديل الإشعارات
4. **Cron Jobs** - إدارة المهام المجدولة
5. **WhatsApp** - تفعيل WhatsApp وعرض QR Code
6. **System Monitor** - مراقبة الأداء والموارد
7. **Audit Log** - سجل العمليات

---

## 🗄️ قاعدة البيانات الإدارية

### الجداول:

#### 1. `users`
```sql
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- password_hash (TEXT)
- email (TEXT)
- role (TEXT) -- 'superadmin', 'admin', 'viewer'
- created_at (DATETIME)
- last_login (DATETIME)
- is_active (INTEGER)
```

#### 2. `settings`
```sql
- id (INTEGER PRIMARY KEY)
- category (TEXT) -- 'erpnext', 'clickup', 'openai', 'whatsapp', 'system'
- key (TEXT)
- value (TEXT)
- data_type (TEXT) -- 'string', 'boolean', 'number', 'json'
- description (TEXT)
- is_encrypted (INTEGER)
- updated_at (DATETIME)
```

#### 3. `notification_configs`
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE)
- type (TEXT) -- 'scheduled', 'event', 'manual'
- enabled (INTEGER)
- schedule (TEXT) -- Cron expression
- message_template (TEXT)
- recipients (TEXT) -- JSON array
- conditions (TEXT) -- JSON object
- created_at (DATETIME)
- updated_at (DATETIME)
```

#### 4. `cron_jobs`
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE)
- schedule (TEXT)
- function_name (TEXT)
- enabled (INTEGER)
- last_run (DATETIME)
- next_run (DATETIME)
- parameters (TEXT) -- JSON
- description (TEXT)
- created_at (DATETIME)
```

#### 5. `whatsapp_session`
```sql
- id (INTEGER PRIMARY KEY)
- is_connected (INTEGER)
- qr_code (TEXT) -- Base64 data URL
- session_data (TEXT)
- phone_number (TEXT)
- connected_at (DATETIME)
- updated_at (DATETIME)
```

#### 6. `audit_log`
```sql
- id (INTEGER PRIMARY KEY)
- user_id (INTEGER)
- action (TEXT)
- category (TEXT)
- details (TEXT) -- JSON
- ip_address (TEXT)
- timestamp (DATETIME)
```

#### 7. `system_stats`
```sql
- id (INTEGER PRIMARY KEY)
- stat_name (TEXT)
- stat_value (TEXT)
- timestamp (DATETIME)
```

---

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/login`
تسجيل الدخول

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@clickup.local",
    "role": "superadmin"
  }
}
```

#### POST `/api/auth/change-password`
تغيير كلمة المرور

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "current_password": "old_password",
  "new_password": "new_password"
}
```

---

### Settings Management

#### GET `/api/settings`
الحصول على جميع الإعدادات

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `category` (optional) - فلترة حسب الفئة

**Response:**
```json
{
  "erpnext": [
    {
      "id": 1,
      "key": "base_url",
      "value": "https://erp.example.com",
      "data_type": "string",
      "description": "ERPNext base URL",
      "is_encrypted": false,
      "updated_at": "2024-01-01 12:00:00"
    }
  ],
  "clickup": [...],
  "openai": [...]
}
```

#### PUT `/api/settings/<id>`
تحديث إعداد

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "value": "new_value"
}
```

#### POST `/api/settings`
إنشاء إعداد جديد

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "category": "custom",
  "key": "my_setting",
  "value": "some_value",
  "data_type": "string",
  "description": "My custom setting",
  "is_encrypted": false
}
```

---

### Notifications Management

#### GET `/api/notifications`
الحصول على جميع الإشعارات

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Daily Morning Report",
    "type": "scheduled",
    "enabled": true,
    "schedule": "30 8 * * *",
    "message_template": "صباح الخير! ملخص المهام...",
    "recipients": ["group@g.us"],
    "conditions": {},
    "created_at": "2024-01-01 10:00:00",
    "updated_at": "2024-01-01 10:00:00"
  }
]
```

#### POST `/api/notifications`
إنشاء إشعار جديد

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Custom Notification",
  "type": "scheduled",
  "enabled": true,
  "schedule": "0 9 * * *",
  "message_template": "رسالتي المخصصة",
  "recipients": ["201234567890@c.us"],
  "conditions": {
    "min_tasks": 5
  }
}
```

#### PUT `/api/notifications/<id>`
تحديث إشعار

#### DELETE `/api/notifications/<id>`
حذف إشعار

---

### Cron Jobs Management

#### GET `/api/cron-jobs`
الحصول على جميع المهام المجدولة

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Morning Inspiration",
    "schedule": "5 8 * * *",
    "function_name": "sendAIMorningInspiration",
    "enabled": true,
    "last_run": "2024-01-01 08:05:00",
    "next_run": "2024-01-02 08:05:00",
    "parameters": {},
    "description": "Send AI-generated morning inspiration",
    "created_at": "2024-01-01 00:00:00"
  }
]
```

#### POST `/api/cron-jobs/<id>/toggle`
تفعيل/إيقاف مهمة

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Job status updated",
  "enabled": false
}
```

---

### WhatsApp Management

#### GET `/api/whatsapp/status`
الحصول على حالة WhatsApp

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "is_connected": true,
  "phone_number": "201234567890",
  "qr_code": null,
  "connected_at": "2024-01-01 10:00:00",
  "updated_at": "2024-01-01 10:00:00"
}
```

#### POST `/api/whatsapp/qr-code` *(من Node.js)*
استقبال QR Code

**Request:**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgo..."
}
```

#### POST `/api/whatsapp/status` *(من Node.js)*
تحديث حالة الاتصال

**Request:**
```json
{
  "is_connected": true,
  "phone_number": "201234567890"
}
```

---

### System Monitoring

#### GET `/api/system/stats`
الحصول على إحصائيات النظام

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.8,
    "disk_percent": 38.5
  },
  "database": {
    "total_orders": 1250,
    "total_deliveries": 980,
    "total_invoices": 856,
    "database_size_mb": 15.4
  },
  "services": {
    "python_backend": true,
    "nodejs_backend": true
  }
}
```

---

### Audit Log

#### GET `/api/audit-log`
الحصول على سجل العمليات

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `limit` (default: 100)
- `category` (optional)

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "action": "update_setting",
    "category": "settings",
    "details": {
      "setting_id": 5,
      "category": "clickup",
      "key": "access_token"
    },
    "ip_address": "192.168.1.100",
    "timestamp": "2024-01-01 12:30:00"
  }
]
```

---

## 🔌 Socket.IO Events

### Client → Server

#### `connect`
الاتصال بالخادم

**Response:**
```json
{
  "message": "Connected to admin server"
}
```

#### `request_qr_code`
طلب QR Code لـ WhatsApp

**Triggers:** طلب من Node.js لإنشاء QR Code جديد

---

### Server → Client

#### `connected`
تأكيد الاتصال

#### `qr_code_updated`
QR Code جديد

**Data:**
```json
{
  "qr_code": "data:image/png;base64,..."
}
```

#### `whatsapp_status`
تحديث حالة WhatsApp

**Data:**
```json
{
  "is_connected": true,
  "phone_number": "201234567890"
}
```

---

## 🚀 التثبيت والتشغيل

### 1. تثبيت Admin API

```bash
cd admin-api

# إنشاء virtual environment
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install Flask flask-cors flask-socketio python-jose python-dotenv psutil

# تشغيل الخادم
python admin_server.py
```

### 2. تثبيت Frontend Dashboard

```bash
cd admin-dashboard

# تثبيت المكتبات
npm install

# تشغيل في وضع التطوير
npm run dev

# أو Build للإنتاج
npm run build
```

---

## 🔐 الأمان

### بيانات الدخول الافتراضية
```
Username: admin
Password: admin123
```

**⚠️ مهم جداً: غيّر كلمة المرور فوراً بعد أول تسجيل دخول!**

### تغيير كلمة المرور

1. سجل دخول بالبيانات الافتراضية
2. اذهب إلى Settings → Change Password
3. أدخل كلمة مرور قوية جديدة

---

## 🎨 واجهة المستخدم

### الصفحة الرئيسية (Dashboard)
- عرض إحصائيات عامة
- حالة الخدمات (Python, Node.js, WhatsApp)
- آخر العمليات
- رسوم بيانية للأداء

### Settings
- تبويبات حسب الفئة (ERPNext, ClickUp, OpenAI, WhatsApp, System)
- تعديل القيم مباشرة
- حفظ تلقائي
- إخفاء القيم المشفرة

### Notifications
- قائمة بجميع الإشعارات
- إضافة إشعار جديد
- تعديل/حذف
- تفعيل/إيقاف
- معاينة الرسالة

### Cron Jobs
- عرض جميع المهام المجدولة
- تفعيل/إيقاف مباشر
- عرض آخر وقت تشغيل
- عرض الوقت القادم

### WhatsApp
- عرض حالة الاتصال
- QR Code في الوقت الفعلي
- زر تفعيل/إعادة تفعيل
- اختبار إرسال رسالة
- معلومات الجلسة

### System Monitor
- استخدام CPU, RAM, Disk
- حالة الخدمات
- إحصائيات قاعدة البيانات
- رسوم بيانية فورية

### Audit Log
- سجل كامل بجميع العمليات
- فلترة حسب الفئة
- فلترة حسب المستخدم
- تصدير CSV

---

## 🔧 التخصيص

### إضافة إعداد جديد

```bash
# عبر API
curl -X POST http://localhost:5010/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "custom",
    "key": "my_feature_enabled",
    "value": "true",
    "data_type": "boolean",
    "description": "Enable my custom feature"
  }'
```

### إضافة إشعار مخصص

```bash
curl -X POST http://localhost:5010/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend Summary",
    "type": "scheduled",
    "schedule": "0 18 * * 5",
    "message_template": "ملخص الأسبوع: {summary}",
    "recipients": ["group@g.us"],
    "enabled": true
  }'
```

---

## 📊 المراقبة والتشخيص

### فحص صحة النظام

```bash
# Admin API
curl http://localhost:5010/api/system/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Python Backend
curl http://localhost:5005/health

# Node.js Backend
curl http://localhost:5014/health
```

### عرض السجلات

```bash
# Admin API logs
tail -f admin.log

# معلومات إضافية في Audit Log
# عبر Dashboard → Audit Log
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا يمكن تسجيل الدخول
**الحل:**
```bash
# إعادة تعيين كلمة المرور يدوياً
cd admin-api
python3
>>> import sqlite3, hashlib
>>> conn = sqlite3.connect('admin.db')
>>> c = conn.cursor()
>>> new_hash = hashlib.sha256(b'newpassword').hexdigest()
>>> c.execute("UPDATE users SET password_hash = ? WHERE username = 'admin'", (new_hash,))
>>> conn.commit()
```

### المشكلة: QR Code لا يظهر
**الحل:**
1. تحقق من تشغيل Node.js backend على المنفذ 5014
2. تحقق من Socket.IO connection
3. راجع Console في المتصفح
4. أعد تشغيل WhatsApp service

### المشكلة: الإعدادات لا تُحفظ
**الحل:**
1. تحقق من صلاحيات قاعدة البيانات
2. راجع Audit Log لمعرفة السبب
3. تأكد من صحة token

---

## 🔄 التحديثات المستقبلية

- [ ] Multi-user support مع صلاحيات متقدمة
- [ ] إدارة قوالب الرسائل
- [ ] تحرير AI prompts من الواجهة
- [ ] تقارير مخصصة
- [ ] تصدير/استيراد الإعدادات
- [ ] نسخ احتياطي تلقائي
- [ ] دعم Dark Mode
- [ ] Mobile App

---

## 📚 المراجع

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Socket.IO](https://socket.io/)

---

**تم إنشاء لوحة التحكم الإدارية بواسطة:** ClickUp Integration Team
**الإصدار:** 2.0
**آخر تحديث:** نوفمبر 2024
