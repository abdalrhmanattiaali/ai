# 📘 دليل التثبيت الشامل - ClickUp Integration System

## 📋 المتطلبات الأساسية

### البرمجيات المطلوبة

| البرنامج | الإصدار الأدنى | التحقق من الإصدار |
|----------|----------------|-------------------|
| Python | 3.8+ | `python3 --version` |
| Node.js | 16.0+ | `node --version` |
| npm | 8.0+ | `npm --version` |
| SQLite | 3.x | `sqlite3 --version` |
| Git | 2.x | `git --version` |

### الحسابات والـ API Keys

✅ حساب ERPNext مع API Key و Secret
✅ حساب ClickUp مع Access Token
✅ حساب OpenAI مع API Key
✅ رقم WhatsApp للبوت

## 🚀 خطوات التثبيت

### الطريقة 1: التثبيت التلقائي (الموصى بها)

```bash
# 1. Clone المشروع
git clone https://github.com/your-org/clickup-integration-system.git
cd clickup-integration-system

# 2. منح صلاحيات التنفيذ
chmod +x scripts/setup.sh scripts/manage.sh

# 3. تشغيل التثبيت
./scripts/setup.sh

# 4. تعديل الإعدادات
nano python-backend/.env
nano nodejs-backend/.env

# 5. تشغيل الخدمات
./scripts/manage.sh start
```

### الطريقة 2: التثبيت اليدوي

#### خطوة 1: تثبيت متطلبات النظام

##### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    sqlite3 \
    git \
    curl \
    build-essential

# تثبيت Node.js 16+ (إذا لم يكن موجوداً)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

##### CentOS/RHEL

```bash
sudo yum install -y \
    python3 \
    python3-pip \
    nodejs \
    npm \
    sqlite \
    git \
    curl

# تثبيت Node.js 16+
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs
```

#### خطوة 2: استنساخ المشروع

```bash
cd /opt  # أو المجلد الذي تريده
git clone https://github.com/your-org/clickup-integration-system.git
cd clickup-integration-system
```

#### خطوة 3: إعداد Python Backend

```bash
cd python-backend

# إنشاء البيئة الافتراضية
python3 -m venv venv

# تفعيل البيئة
source venv/bin/activate

# ترقية pip
pip install --upgrade pip

# تثبيت المكتبات
pip install -r requirements.txt

# نسخ ملف الإعداد
cp ../config/.env.python.example .env
```

تعديل `.env`:

```bash
nano .env
```

املأ القيم التالية:

```env
# ERPNext
ERP_BASE_URL=https://your-erp-domain.com
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here

# ClickUp
CLICKUP_ACCESS_TOKEN=pk_xxxxxxxxxxxxxxxxxxxxxxxx

# ClickUp List IDs (احصل عليها من ClickUp)
CLICKUP_LIST_ID=123456789
CLICKUP_SAMPLES_LIST_ID=123456790
CLICKUP_DELIVERY_LIST_ID=123456791
# ... (باقي القوائم)

# Team members (User IDs from ClickUp)
ASSIGNEES=62585187,74558888,74558852

# WhatsApp
WHATSAPP_GATEWAY_URL=http://127.0.0.1:5014/send
WHATSAPP_DEFAULT_TO=201234567890@c.us

# Database
DATABASE_FILE=./clickup_log.db

# Logging
LOG_FILE=/var/log/clickup_integration.log
LOG_LEVEL=INFO
```

#### خطوة 4: إعداد Node.js Backend

```bash
cd ../nodejs-backend

# تثبيت المكتبات
npm install

# نسخ ملف الإعداد
cp ../config/.env.nodejs.example .env
```

تعديل `.env`:

```bash
nano .env
```

```env
# ClickUp
CLICKUP_TOKEN=pk_xxxxxxxxxxxxxxxxxxxxxxxx
CLICKUP_TEAM_ID=your_team_id
SAMPLE_LIST_ID=123456789

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# WhatsApp
WHATSAPP_GROUP_NAME=Click Up notification 📢

# Users mapping
USER_1_PHONE=201234567890
USER_1_NAME=Ahmed

USER_2_PHONE=201234567891
USER_2_NAME=Mohamed

USER_3_PHONE=201234567892
USER_3_NAME=Hassan

# Server
PORT=5014
```

#### خطوة 5: تهيئة قاعدة البيانات

```bash
cd ../python-backend
source venv/bin/activate
python3 ../database/init_db.py
```

يجب أن ترى:

```
Initializing database: ./clickup_log.db
Creating processed_orders table...
Creating customer_delivery_tasks table...
...
✅ Database initialized successfully with 7 tables
```

#### خطوة 6: إنشاء ملف السجل

```bash
sudo touch /var/log/clickup_integration.log
sudo chown $USER:$USER /var/log/clickup_integration.log
sudo chmod 644 /var/log/clickup_integration.log
```

#### خطوة 7: إعداد systemd Services

```bash
# نسخ ملفات الخدمات
sudo cp scripts/clickup-python.service /etc/systemd/system/
sudo cp scripts/clickup-nodejs.service /etc/systemd/system/
```

تعديل الخدمات بالمسارات الصحيحة:

```bash
# تعديل Python service
sudo nano /etc/systemd/system/clickup-python.service
```

غيّر:
- `your_user` إلى اسم المستخدم الحالي
- `your_group` إلى المجموعة الحالية
- `/path/to/clickup-integration-system` إلى المسار الفعلي

```bash
# تعديل Node.js service
sudo nano /etc/systemd/system/clickup-nodejs.service
```

نفس التغييرات السابقة.

```bash
# إعادة تحميل systemd
sudo systemctl daemon-reload

# تفعيل الخدمات
sudo systemctl enable clickup-python
sudo systemctl enable clickup-nodejs
```

#### خطوة 8: تشغيل الخدمات

```bash
# تشغيل Python backend
sudo systemctl start clickup-python

# تشغيل Node.js backend
sudo systemctl start clickup-nodejs

# فحص الحالة
sudo systemctl status clickup-python
sudo systemctl status clickup-nodejs
```

#### خطوة 9: مسح QR Code للـ WhatsApp

عند أول تشغيل، ستحتاج لمسح QR Code:

```bash
# عرض السجلات
sudo journalctl -u clickup-nodejs -f
```

ستظهر QR Code - امسحها بتطبيق WhatsApp على هاتفك.

## 🔧 إعداد الـ Webhooks

### ERPNext Webhooks

1. اذهب إلى: **Settings → Integrations → Webhook**
2. أنشئ Webhook جديد لكل DocType:

#### Sales Order Webhook

- **DocType**: Sales Order
- **Request URL**: `http://your-server:5005/clickup-webhook`
- **Request Method**: POST
- **Webhook DocType**: Sales Order
- **Trigger On**: After Insert
- **Enabled**: ✓

#### Sample Request Webhook

- **DocType**: Sample Request
- **Request URL**: `http://your-server:5005/clickup-samples-webhook`
- **Request Method**: POST
- **Trigger On**: After Insert
- **Enabled**: ✓

#### Delivery Note Webhook

- **DocType**: Delivery Note
- **Request URL**: `http://your-server:5005/clickup-delivery-webhook`
- **Request Method**: POST
- **Trigger On**: After Insert
- **Enabled**: ✓

#### Sales Invoice Webhook

- **DocType**: Sales Invoice
- **Request URL**: `http://your-server:5005/clickup-invoice-webhook`
- **Request Method**: POST
- **Trigger On**: After Insert
- **Enabled**: ✓

#### Payment Entry Webhook

- **DocType**: Payment Entry
- **Request URL**: `http://your-server:5005/clickup-payment-webhook`
- **Request Method**: POST
- **Trigger On**: After Insert
- **Enabled**: ✓

#### Work Order Webhook

- **DocType**: Work Order
- **Request URL**: `http://your-server:5005/work-order-webhook`
- **Request Method**: POST
- **Trigger On**: After Insert
- **Enabled**: ✓

### ClickUp Webhooks

1. اذهب إلى: **Settings → Integrations → Webhooks**
2. اضغط **Create Webhook**
3. املأ البيانات:

- **Endpoint**: `http://your-server:5014`
- **Events to listen**:
  - [x] Task Created → `/task-created-webhook`
  - [x] Task Updated → `/task-updated-webhook`
  - [x] Task Comment Posted → `/task-comment-webhook`

4. احفظ الـ Webhook

## ✅ اختبار التثبيت

### 1. فحص صحة الخدمات

```bash
# Python backend
curl http://localhost:5005/health

# Node.js backend
curl http://localhost:5014/health
```

### 2. فحص السجلات

```bash
# السجلات الحية
./scripts/manage.sh logs

# أو يدوياً
tail -f /var/log/clickup_integration.log
sudo journalctl -u clickup-nodejs -f
```

### 3. اختبار Webhook يدوياً

```bash
# اختبار Python webhook
curl -X POST http://localhost:5005/health \
  -H "Content-Type: application/json"

# اختبار Node.js webhook
curl -X POST http://localhost:5014/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

### 4. فحص قاعدة البيانات

```bash
cd python-backend
sqlite3 clickup_log.db "SELECT name FROM sqlite_master WHERE type='table';"
```

## 🔥 Firewall Configuration

إذا كنت تستخدم UFW:

```bash
# تفعيل Firewall
sudo ufw enable

# السماح بـ SSH (مهم!)
sudo ufw allow 22/tcp

# السماح بمنافذ التطبيق من ERPNext server فقط
sudo ufw allow from YOUR_ERP_SERVER_IP to any port 5005
sudo ufw allow from YOUR_ERP_SERVER_IP to any port 5014

# أو السماح من أي IP (غير موصى به للإنتاج)
sudo ufw allow 5005/tcp
sudo ufw allow 5014/tcp

# فحص القواعد
sudo ufw status verbose
```

## 📊 المراقبة الأولية

### فحص استهلاك الموارد

```bash
# CPU & Memory
htop

# أو
top -p $(pgrep -d',' -f 'clickup_webhook|index1.js')
```

### فحص المنافذ

```bash
# فحص المنافذ المفتوحة
sudo netstat -tulpn | grep -E '5005|5014'

# أو
sudo ss -tulpn | grep -E '5005|5014'
```

### حجم قاعدة البيانات

```bash
du -h python-backend/clickup_log.db
```

## 🐛 استكشاف الأخطاء الشائعة

### خطأ: ModuleNotFoundError

```bash
# تأكد من تفعيل البيئة الافتراضية
cd python-backend
source venv/bin/activate

# أعد تثبيت المكتبات
pip install -r requirements.txt
```

### خطأ: Port already in use

```bash
# ابحث عن العملية
sudo lsof -i :5005
sudo lsof -i :5014

# أوقف العملية
sudo kill -9 <PID>
```

### خطأ: WhatsApp QR Code لا يظهر

```bash
# احذف الجلسة القديمة
rm -rf nodejs-backend/.wwebjs_auth

# أعد تشغيل الخدمة
sudo systemctl restart clickup-nodejs

# اعرض السجلات
sudo journalctl -u clickup-nodejs -f
```

### خطأ: Database is locked

```bash
# أغلق جميع الاتصالات
sudo systemctl stop clickup-python

# انتظر قليلاً
sleep 5

# أعد التشغيل
sudo systemctl start clickup-python
```

## 📚 الخطوات التالية

بعد التثبيت الناجح:

1. ✅ اختبر إنشاء طلب بيع في ERPNext
2. ✅ تحقق من إنشاء المهمة في ClickUp
3. ✅ تحقق من استلام الإشعار في WhatsApp
4. ✅ راجع التقارير اليومية
5. ✅ فعّل المراقبة والنسخ الاحتياطي

## 🆘 الحصول على المساعدة

إذا واجهت مشاكل:

1. راجع السجلات: `./scripts/manage.sh logs`
2. تحقق من الـ [Troubleshooting Guide](TROUBLESHOOTING.md)
3. افتح Issue على GitHub
4. تواصل مع فريق الدعم

---

**تم التثبيت بنجاح؟** 🎉 انتقل إلى [دليل الاستخدام](USAGE.md)
