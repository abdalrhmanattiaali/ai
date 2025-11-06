# 📁 بنية المشروع - ClickUp Integration System

## 📂 هيكل الملفات والمجلدات

```
clickup-integration-system/
│
├── 📄 README.md                      # الوثائق الرئيسية
├── 📄 LICENSE                        # ترخيص MIT
├── 📄 PROJECT_STRUCTURE.md           # هذا الملف
├── 📄 .gitignore                     # ملفات Git المتجاهلة
│
├── 📁 python-backend/                # Python Flask Backend
│   ├── 📄 clickup_webhook.py         # الملف الرئيسي (Flask Server)
│   ├── 📄 requirements.txt           # مكتبات Python
│   ├── 📄 .env                       # إعدادات (يتم إنشاؤها)
│   ├── 📄 clickup_log.db             # قاعدة البيانات SQLite (يتم إنشاؤها)
│   └── 📁 venv/                      # البيئة الافتراضية (يتم إنشاؤها)
│
├── 📁 nodejs-backend/                # Node.js Express Backend
│   ├── 📄 index1.js                  # الملف الرئيسي (Express + WhatsApp Bot)
│   ├── 📄 package.json               # مكتبات Node.js
│   ├── 📄 .env                       # إعدادات (يتم إنشاؤها)
│   ├── 📁 node_modules/              # المكتبات (يتم إنشاؤها)
│   └── 📁 .wwebjs_auth/              # جلسة WhatsApp (يتم إنشاؤها)
│
├── 📁 config/                        # ملفات الإعداد
│   ├── 📄 .env.python.example        # نموذج إعداد Python
│   ├── 📄 .env.nodejs.example        # نموذج إعداد Node.js
│   └── 📄 prompts.txt                # نصوص AI التحفيزية
│
├── 📁 database/                      # قاعدة البيانات
│   ├── 📄 init_db.py                 # سكريبت تهيئة قاعدة البيانات
│   └── 📁 backups/                   # نسخ احتياطية (يتم إنشاؤها)
│
├── 📁 scripts/                       # سكريبتات الإدارة
│   ├── 📄 setup.sh                   # سكريبت التثبيت التلقائي
│   ├── 📄 manage.sh                  # سكريبت إدارة الخدمات
│   ├── 📄 clickup-python.service     # خدمة systemd لـ Python
│   └── 📄 clickup-nodejs.service     # خدمة systemd لـ Node.js
│
├── 📁 docs/                          # الوثائق
│   ├── 📄 INSTALLATION.md            # دليل التثبيت الكامل
│   ├── 📄 QUICKSTART.md              # دليل البدء السريع
│   ├── 📄 USAGE.md                   # دليل الاستخدام
│   └── 📄 TROUBLESHOOTING.md         # دليل استكشاف الأخطاء
│
└── 📁 logs/                          # السجلات (يتم إنشاؤها)
    └── 📄 clickup_integration.log    # سجل التطبيق
```

## 📋 وصف المكونات

### 🐍 Python Backend (python-backend/)

**الملف الرئيسي**: `clickup_webhook.py`

**الوظيفة**: استقبال webhooks من ERPNext وإنشاء مهام في ClickUp

**المنافذ**: 5005

**المكونات الرئيسية**:
- Webhook handlers لجميع DocTypes في ERPNext
- اتصال بـ ClickUp API
- إدارة قاعدة البيانات SQLite
- جدولة المهام (APScheduler)
- فحص الفواتير المتأخرة
- التقارير الشهرية

**Endpoints**:
- `/clickup-webhook` - Sales Orders
- `/clickup-samples-webhook` - Sample Requests
- `/clickup-delivery-webhook` - Delivery Notes
- `/clickup-invoice-webhook` - Sales Invoices
- `/clickup-payment-webhook` - Payment Entries
- `/clickup-cheque-clearing-webhook` - Cheque Clearing
- `/work-order-webhook` - Work Orders
- `/trigger-check` - Manual overdue check
- `/monthly-summary` - Monthly report
- `/health` - Health check

### 📡 Node.js Backend (nodejs-backend/)

**الملف الرئيسي**: `index1.js`

**الوظيفة**:
- استقبال webhooks من ClickUp
- إرسال إشعارات عبر WhatsApp
- إنشاء محتوى AI تحفيزي
- تقارير يومية وأسبوعية

**المنافذ**: 5014

**المكونات الرئيسية**:
- Express server
- WhatsApp Bot (whatsapp-web.js)
- نظام طوابير الإشعارات
- OpenAI GPT-4 integration
- Cron jobs للمهام المجدولة

**Endpoints**:
- `/task-created-webhook` - Task created
- `/task-updated-webhook` - Task updated
- `/task-comment-webhook` - Comment posted
- `/send` - Send WhatsApp message
- `/pause-notifications` - Pause notifications
- `/health` - Health check

**Scheduled Jobs**:
- 08:05 - Morning inspiration
- 08:30 - Daily user tasks
- 09:15 - Inspirational content
- 23:45 - Evening user tasks
- 23:50 - Daily highlights
- 23:55 - Group stats
- 23:58 - Goodnight message
- Friday 09:00 - Weekly report

### 🗄️ Database (database/)

**الملف**: `clickup_log.db` (SQLite)

**الجداول**:
1. `processed_orders` - أوامر معالجة
2. `customer_delivery_tasks` - مهام التسليم للعملاء
3. `customer_invoice_tasks` - مهام الفواتير للعملاء
4. `customer_payment_tasks` - مهام الدفع للعملاء
5. `customer_overdue_invoice_tasks` - مهام الفواتير المتأخرة
6. `task_templates` - قوالب المهام
7. `system_metrics` - مقاييس النظام

### ⚙️ Configuration (config/)

**ملفات الإعداد**:
- `.env.python.example` - نموذج إعداد Python
- `.env.nodejs.example` - نموذج إعداد Node.js
- `prompts.txt` - نصوص AI

**المتغيرات البيئية الأساسية**:

Python:
- ERPNext credentials
- ClickUp token and list IDs
- Team assignees
- WhatsApp gateway URL
- Database path
- Logging configuration

Node.js:
- ClickUp token and team ID
- OpenAI API key
- WhatsApp group name
- User phone mappings
- Server port

### 🔧 Scripts (scripts/)

**السكريبتات**:

1. **setup.sh** - التثبيت التلقائي
   - تثبيت المتطلبات
   - إعداد البيئات
   - تهيئة قاعدة البيانات
   - إعداد الخدمات

2. **manage.sh** - إدارة الخدمات
   - تشغيل/إيقاف الخدمات
   - عرض السجلات
   - فحص الصحة
   - نسخ احتياطي للبيانات

3. **clickup-python.service** - خدمة systemd للـ Python
4. **clickup-nodejs.service** - خدمة systemd للـ Node.js

### 📚 Documentation (docs/)

**الوثائق المتوفرة**:
1. **INSTALLATION.md** - دليل التثبيت الشامل
2. **QUICKSTART.md** - البدء السريع
3. **USAGE.md** - دليل الاستخدام
4. **TROUBLESHOOTING.md** - استكشاف الأخطاء

## 🔄 تدفق البيانات (Data Flow)

```
ERPNext
   ↓ (Webhook)
Python Backend (Port 5005)
   ↓ (API Call)
ClickUp
   ↓ (Webhook)
Node.js Backend (Port 5014)
   ↓ (Message)
WhatsApp
```

### تفصيل التدفق:

1. **ERPNext → Python Backend**:
   - حدث في ERPNext (مثل: إنشاء طلب بيع)
   - Webhook يرسل البيانات إلى Python Backend
   - Python Backend يعالج البيانات ويحفظها في قاعدة البيانات

2. **Python Backend → ClickUp**:
   - إنشاء مهمة رئيسية
   - إنشاء مهام فرعية
   - إضافة checklists
   - تعيين المهام للفريق

3. **ClickUp → Node.js Backend**:
   - حدث في ClickUp (مثل: تعيين مهمة)
   - Webhook يرسل البيانات إلى Node.js Backend
   - Node.js Backend يضيف للطابور

4. **Node.js Backend → WhatsApp**:
   - معالجة طابور الإشعارات
   - تجميع الإشعارات
   - إرسال رسالة واحدة للمجموعة
   - إرسال رسائل مباشرة للمستخدمين

## 🔐 الأمان

**الملفات الحساسة** (يجب عدم رفعها لـ Git):
- `.env` files
- `clickup_log.db`
- `.wwebjs_auth/`
- `*.log` files

**محمية بواسطة** `.gitignore`

## 📊 متطلبات الموارد

### الحد الأدنى:
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Disk**: 10 GB
- **Network**: 10 Mbps

### الموصى به:
- **CPU**: 4 cores
- **RAM**: 4 GB
- **Disk**: 20 GB SSD
- **Network**: 100 Mbps

## 🔌 المنافذ المستخدمة

| المنفذ | الخدمة | الوصف |
|-------|--------|-------|
| 5005 | Python Backend | Flask Webhook Server |
| 5014 | Node.js Backend | Express + WhatsApp Bot |

## 📈 قابلية التوسع

النظام مصمم ليكون قابلاً للتوسع:

1. **Horizontal Scaling**: يمكن تشغيل عدة نسخ مع Load Balancer
2. **Database**: يمكن الانتقال من SQLite إلى PostgreSQL
3. **Caching**: يمكن إضافة Redis للتخزين المؤقت
4. **Queue**: يمكن استخدام RabbitMQ أو Celery

## 🧰 الأدوات المساعدة

### للتطوير:
- **Python**: `venv` للبيئة الافتراضية
- **Node.js**: `npm` لإدارة المكتبات
- **SQLite**: لقاعدة البيانات

### للإنتاج:
- **systemd**: لإدارة الخدمات
- **journalctl**: للسجلات
- **htop**: لمراقبة الموارد

## 📝 ملاحظات

1. **النسخ الاحتياطي**: نفذ نسخ احتياطي يومي لقاعدة البيانات
2. **المراقبة**: راقب السجلات بانتظام
3. **التحديثات**: حدّث المكتبات شهرياً
4. **الأمان**: غيّر API keys بانتظام

---

**آخر تحديث**: نوفمبر 2024
**الإصدار**: 2.0
