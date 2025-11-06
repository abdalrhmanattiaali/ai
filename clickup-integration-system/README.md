# 📋 ClickUp Integration System v2.0

نظام متكامل لإدارة المهام والإشعارات يربط بين ERPNext، ClickUp، WhatsApp، وOpenAI GPT

## 🎯 نظرة عامة

نظام شامل لأتمتة إدارة المهام من خلال الربط بين:
- **ERPNext** - نظام تخطيط موارد المؤسسات
- **ClickUp** - نظام إدارة المهام والمشاريع
- **WhatsApp** - نظام الإشعارات والتواصل
- **OpenAI GPT-4** - الذكاء الاصطناعي للمحتوى التحفيزي

## ✨ المميزات الرئيسية

### 🔄 الأتمتة الكاملة
- إنشاء تلقائي للمهام من ERPNext إلى ClickUp
- إشعارات فورية عبر WhatsApp
- تقارير يومية وأسبوعية تلقائية
- فحص تلقائي للفواتير المتأخرة

### 🤖 الذكاء الاصطناعي
- محتوى تحفيزي صباحي
- تقارير ملخصة ذكية
- رسائل إلهامية مخصصة
- تحليل وملخصات أسبوعية

### 📊 التقارير والإحصائيات
- تقارير شخصية لكل مستخدم
- إحصائيات الفريق اليومية
- تقارير شهرية شاملة
- متابعة الأداء والإنتاجية

### 🔔 نظام إشعارات ذكي
- تجميع الإشعارات (Batching)
- منع التكرار (Deduplication)
- إشعارات مباشرة للمستخدمين
- إمكانية الإيقاف المؤقت

## 🏗️ البنية المعمارية

```
┌─────────────────┐
│    ERPNext      │ ──Webhooks──┐
└─────────────────┘              │
                                 ↓
                          ┌──────────────┐
                          │ Python Flask │
                          │   (Port 5005)│
                          └──────────────┘
                                 │ Creates Tasks
                                 ↓
┌─────────────────┐      ┌──────────────┐
│    ClickUp      │ ←────│  SQLite DB   │
└─────────────────┘      └──────────────┘
         │
         │ Webhooks
         ↓
  ┌──────────────┐
  │ Node.js + AI │
  │  (Port 5014) │
  └──────────────┘
         │
         ↓
  ┌──────────────┐
  │   WhatsApp   │
  └──────────────┘
```

## 📦 المتطلبات

### نظام التشغيل
- Ubuntu 20.04+ / Debian 10+ / CentOS 8+
- أو أي نظام Linux يدعم systemd

### البرمجيات الأساسية
- **Python 3.8+**
- **Node.js 16+**
- **npm 8+**
- **SQLite 3**
- **Git**

### حسابات وAPI Keys مطلوبة
- حساب ERPNext مع API Key & Secret
- حساب ClickUp مع Access Token
- حساب OpenAI مع API Key
- رقم WhatsApp (للبوت)

## 🚀 التثبيت السريع

### الطريقة 1: التثبيت التلقائي (موصى به)

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-org/clickup-integration-system.git
cd clickup-integration-system

# 2. تشغيل سكريبت التثبيت
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. تعديل ملفات الإعداد
nano python-backend/.env
nano nodejs-backend/.env

# 4. تشغيل الخدمات
sudo systemctl start clickup-python
sudo systemctl start clickup-nodejs

# 5. تفعيل التشغيل التلقائي
sudo systemctl enable clickup-python
sudo systemctl enable clickup-nodejs
```

### الطريقة 2: التثبيت اليدوي

#### خطوة 1: تثبيت المتطلبات

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv nodejs npm sqlite3 git curl

# CentOS/RHEL
sudo yum install -y python3 python3-pip nodejs npm sqlite git curl
```

#### خطوة 2: إعداد Python Backend

```bash
cd python-backend

# إنشاء بيئة افتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install -r requirements.txt

# نسخ ملف الإعداد
cp ../config/.env.python.example .env

# تعديل الإعداد
nano .env
```

#### خطوة 3: إعداد Node.js Backend

```bash
cd nodejs-backend

# تثبيت المكتبات
npm install

# نسخ ملف الإعداد
cp ../config/.env.nodejs.example .env

# تعديل الإعداد
nano .env
```

#### خطوة 4: تهيئة قاعدة البيانات

```bash
cd python-backend
source venv/bin/activate
python3 ../database/init_db.py
```

#### خطوة 5: إعداد systemd Services

```bash
# نسخ ملفات الخدمات
sudo cp scripts/clickup-python.service /etc/systemd/system/
sudo cp scripts/clickup-nodejs.service /etc/systemd/system/

# تعديل المسارات واسم المستخدم
sudo nano /etc/systemd/system/clickup-python.service
sudo nano /etc/systemd/system/clickup-nodejs.service

# إعادة تحميل systemd
sudo systemctl daemon-reload

# تفعيل وتشغيل الخدمات
sudo systemctl enable clickup-python clickup-nodejs
sudo systemctl start clickup-python clickup-nodejs
```

## ⚙️ الإعداد والتكوين

### 1. إعداد ERPNext Webhooks

اذهب إلى: **Settings > Integrations > Webhook**

أنشئ Webhooks للأحداث التالية:

| DocType | Method | URL |
|---------|--------|-----|
| Sales Order | After Insert | `http://your-server:5005/clickup-webhook` |
| Sample Request | After Insert | `http://your-server:5005/clickup-samples-webhook` |
| Delivery Note | After Insert | `http://your-server:5005/clickup-delivery-webhook` |
| Sales Invoice | After Insert | `http://your-server:5005/clickup-invoice-webhook` |
| Payment Entry | After Insert | `http://your-server:5005/clickup-payment-webhook` |
| Work Order | After Insert | `http://your-server:5005/work-order-webhook` |

### 2. إعداد ClickUp Webhooks

اذهب إلى: **Settings > Integrations > Webhooks**

أنشئ Webhook جديد:
- **Endpoint:** `http://your-server:5014`
- **Events:**
  - Task Created → `/task-created-webhook`
  - Task Updated → `/task-updated-webhook`
  - Task Comment Posted → `/task-comment-webhook`

### 3. إعداد WhatsApp Bot

عند أول تشغيل لـ Node.js Backend:

```bash
# تشغيل يدوي لمسح QR Code
cd nodejs-backend
node index1.js
```

سيظهر QR Code - امسحه بتطبيق WhatsApp على هاتفك.

## 🔧 ملفات الإعداد

### Python Backend (.env)

```env
# ERPNext
ERP_BASE_URL=https://erp.stretapro.com
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret

# ClickUp
CLICKUP_ACCESS_TOKEN=your_clickup_token
CLICKUP_LIST_ID=your_list_id
CLICKUP_DELIVERY_LIST_ID=your_delivery_list_id
# ... (باقي القوائم)

# Team
ASSIGNEES=62585187,74558888,74558852

# WhatsApp Gateway
WHATSAPP_GATEWAY_URL=http://127.0.0.1:5014/send
WHATSAPP_DEFAULT_TO=your_chat_id

# Database
DATABASE_FILE=./clickup_log.db

# Logging
LOG_FILE=/var/log/clickup_integration.log
LOG_LEVEL=INFO
```

### Node.js Backend (.env)

```env
# ClickUp
CLICKUP_TOKEN=your_clickup_token
CLICKUP_TEAM_ID=your_team_id

# OpenAI
OPENAI_API_KEY=your_openai_key

# WhatsApp
WHATSAPP_GROUP_NAME=Click Up notification 📢

# Users
USER_1_PHONE=201234567890
USER_1_NAME=Ahmed

USER_2_PHONE=201234567891
USER_2_NAME=Mohamed

USER_3_PHONE=201234567892
USER_3_NAME=Hassan

# Server
PORT=5014
```

## 📡 API Endpoints

### Python Backend (Port 5005)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/clickup-webhook` | Sales Orders |
| POST | `/clickup-samples-webhook` | Sample Requests |
| POST | `/clickup-delivery-webhook` | Delivery Notes |
| POST | `/clickup-invoice-webhook` | Sales Invoices |
| POST | `/clickup-payment-webhook` | Payment Entries |
| POST | `/clickup-cheque-clearing-webhook` | Cheque Clearing |
| POST | `/work-order-webhook` | Work Orders |
| GET | `/trigger-check` | Manual Overdue Check |
| GET | `/monthly-summary` | Monthly Report |
| GET | `/health` | Health Check |

### Node.js Backend (Port 5014)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/task-created-webhook` | Task Created Event |
| POST | `/task-updated-webhook` | Task Updated Event |
| POST | `/task-comment-webhook` | Task Comment Event |
| POST | `/send` | Send WhatsApp Message |
| POST | `/pause-notifications` | Pause Notifications |
| GET | `/health` | Health Check |

## 🕐 المهام المجدولة (Cron Jobs)

### Python Backend
- **Hourly**: فحص الفواتير المتأخرة
- **Monthly (Last day, 23:55)**: التقرير الشهري

### Node.js Backend
- **08:05**: رسالة صباحية تحفيزية
- **08:30**: تقارير المهام الشخصية (صباحاً)
- **09:15**: محتوى ملهم
- **23:45**: تقارير المهام الشخصية (مساءً)
- **23:50**: أبرز إنجازات اليوم
- **23:55**: إحصائيات المجموعة اليومية
- **23:58**: رسالة مسائية
- **Friday 09:00**: التقرير الأسبوعي

## 🐛 استكشاف الأخطاء

### فحص حالة الخدمات

```bash
# فحص حالة الخدمات
sudo systemctl status clickup-python
sudo systemctl status clickup-nodejs

# عرض السجلات
sudo journalctl -u clickup-python -f
sudo journalctl -u clickup-nodejs -f

# السجلات المخصصة
tail -f /var/log/clickup_integration.log
tail -f nodejs-backend/nohup.out
```

### مشاكل شائعة

#### WhatsApp Bot لا يتصل
```bash
# حذف الجلسة القديمة
rm -rf nodejs-backend/.wwebjs_auth

# إعادة تشغيل الخدمة
sudo systemctl restart clickup-nodejs

# مسح QR Code مرة أخرى
sudo journalctl -u clickup-nodejs -f
```

#### قاعدة البيانات معطلة
```bash
# إعادة تهيئة قاعدة البيانات
cd python-backend
source venv/bin/activate
python3 ../database/init_db.py --reset
```

#### Webhooks لا تعمل
```bash
# فحص الاتصال
curl http://localhost:5005/health
curl http://localhost:5014/health

# فحص Firewall
sudo ufw status
sudo ufw allow 5005/tcp
sudo ufw allow 5014/tcp
```

## 📊 المراقبة والصيانة

### مراقبة الأداء

```bash
# استخدام الموارد
htop

# حجم قاعدة البيانات
du -h python-backend/clickup_log.db

# الاتصالات النشطة
netstat -tulpn | grep -E '5005|5014'
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي يدوي
cp python-backend/clickup_log.db \
   backups/clickup_log_$(date +%Y%m%d_%H%M%S).db

# نسخ احتياطي تلقائي (إضافة لـ crontab)
0 2 * * * cp /path/to/clickup_log.db /backups/clickup_log_$(date +\%Y\%m\%d).db
```

### تحديث النظام

```bash
# سحب آخر تحديثات
git pull origin main

# تحديث Python dependencies
cd python-backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

# تحديث Node.js dependencies
cd nodejs-backend
npm update

# إعادة تشغيل الخدمات
sudo systemctl restart clickup-python clickup-nodejs
```

## 🔒 الأمان

### أفضل الممارسات

1. **لا تشارك API Keys** - احتفظ بـ .env آمناً
2. **استخدم HTTPS** - لجميع الاتصالات الخارجية
3. **فعّل Firewall** - حدد الوصول للمنافذ
4. **حدّث بانتظام** - حافظ على تحديث المكتبات
5. **راقب السجلات** - تابع الأحداث الأمنية

### إعداد Firewall

```bash
# تفعيل UFW
sudo ufw enable

# السماح بـ SSH
sudo ufw allow 22/tcp

# السماح بمنافذ التطبيق (فقط من IP محدد)
sudo ufw allow from YOUR_IP to any port 5005
sudo ufw allow from YOUR_IP to any port 5014

# فحص القواعد
sudo ufw status verbose
```

## 📚 الموارد والوثائق

- [ClickUp API Documentation](https://clickup.com/api)
- [ERPNext API Documentation](https://frappeframework.com/docs/user/en/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [WhatsApp Web.js Documentation](https://wwebjs.dev/)

## 🤝 المساهمة

المساهمات مرحب بها! يرجى:
1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push إلى الفرع
5. فتح Pull Request

## 📄 الترخيص

MIT License - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 👥 الفريق

- **Development Team** - التطوير والصيانة
- **Integration Team** - التكامل والاختبار

## 📞 الدعم

للأسئلة والدعم:
- **Email**: support@yourcompany.com
- **Issues**: [GitHub Issues](https://github.com/your-org/clickup-integration/issues)

---

**ClickUp Integration System v2.0** - Made with ❤️ in Egypt
