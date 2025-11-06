# ⚡ دليل البدء السريع - ClickUp Integration System

## 🚀 التثبيت في 5 دقائق

### المتطلبات
- Ubuntu/Debian Linux
- صلاحيات sudo
- اتصال بالإنترنت

### الخطوات

```bash
# 1. Clone المشروع
git clone https://github.com/your-org/clickup-integration-system.git
cd clickup-integration-system

# 2. تشغيل التثبيت
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. تعديل الإعدادات
# Python Backend
nano python-backend/.env
# أضف: ERP_BASE_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET, CLICKUP_ACCESS_TOKEN

# Node.js Backend
nano nodejs-backend/.env
# أضف: CLICKUP_TOKEN, OPENAI_API_KEY

# 4. تشغيل الخدمات
sudo systemctl start clickup-python clickup-nodejs

# 5. مسح QR Code للـ WhatsApp
sudo journalctl -u clickup-nodejs -f
# امسح الـ QR Code بتطبيق WhatsApp
```

## ✅ التحقق من التثبيت

```bash
# فحص الخدمات
curl http://localhost:5005/health
curl http://localhost:5014/health

# عرض السجلات
./scripts/manage.sh status
```

## 🔧 إعداد Webhooks

### ERPNext
1. اذهب إلى: **Settings → Integrations → Webhook**
2. أنشئ webhook لـ Sales Order:
   - URL: `http://your-server:5005/clickup-webhook`
   - Method: POST
   - Trigger: After Insert

### ClickUp
1. اذهب إلى: **Settings → Integrations → Webhooks**
2. أنشئ webhook:
   - Endpoint: `http://your-server:5014`
   - Events: Task Created, Task Updated

## 🎯 اختبار سريع

```bash
# اختبار Python backend
curl -X POST http://localhost:5005/trigger-check

# اختبار Node.js backend
curl -X POST http://localhost:5014/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}'
```

## 📊 أدوات الإدارة

```bash
# استخدام أداة الإدارة
./scripts/manage.sh

# أوامر سريعة
./scripts/manage.sh start    # تشغيل
./scripts/manage.sh stop     # إيقاف
./scripts/manage.sh restart  # إعادة تشغيل
./scripts/manage.sh status   # الحالة
./scripts/manage.sh logs     # السجلات
./scripts/manage.sh health   # فحص الصحة
```

## 🆘 مشاكل شائعة

### الخدمة لا تعمل
```bash
sudo systemctl status clickup-python
sudo journalctl -u clickup-python -n 50
```

### WhatsApp غير متصل
```bash
rm -rf nodejs-backend/.wwebjs_auth
sudo systemctl restart clickup-nodejs
```

### قاعدة البيانات
```bash
cd python-backend
source venv/bin/activate
python3 ../database/init_db.py
```

## 📚 الخطوات التالية

- [دليل التثبيت الكامل](INSTALLATION.md)
- [دليل الاستخدام](USAGE.md)
- [استكشاف الأخطاء](TROUBLESHOOTING.md)

## 💡 نصائح

1. **النسخ الاحتياطي**: نفذ `./scripts/manage.sh backup` بانتظام
2. **المراقبة**: تابع السجلات عبر `./scripts/manage.sh logs`
3. **التحديثات**: `git pull origin main` للحصول على آخر تحديثات

---

**بدأت بنجاح؟** 🎉 تصفح [الوثائق الكاملة](../README.md)
