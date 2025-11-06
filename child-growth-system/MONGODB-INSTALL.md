# 🗄️ دليل تثبيت MongoDB الشامل

---

## 📑 اختر نظام التشغيل:

- [Windows](#windows)
- [macOS](#macos)
- [Linux (Ubuntu/Debian)](#linux-ubuntudebian)
- [Docker (أسهل طريقة)](#docker-أسهل-طريقة-)
- [MongoDB Atlas (Cloud - مجاناً)](#mongodb-atlas-cloud---مجاناً-)

---

# Windows

## الطريقة 1: التثبيت العادي (موصى به)

### 1️⃣ تحميل MongoDB

اذهب إلى:
```
https://www.mongodb.com/try/download/community
```

- اختر:
  - **Version:** أحدث إصدار (7.0 أو أحدث)
  - **Platform:** Windows
  - **Package:** MSI

### 2️⃣ تثبيت MongoDB

1. افتح ملف `.msi` الذي نزلته
2. اضغط **Next** → **Next**
3. اقبل الشروط → **Next**
4. اختر **Complete** Installation
5. في صفحة "Service Configuration":
   - ✅ اختر "Install MongoDB as a Service"
   - ✅ "Run service as Network Service user"
6. اضغط **Next** → **Install**
7. انتظر حتى ينتهي التثبيت
8. اضغط **Finish**

### 3️⃣ التحقق من التثبيت

افتح **Command Prompt** أو **PowerShell**:

```powershell
# التحقق من النسخة
mongod --version

# التحقق من أن الخدمة شغالة
sc query MongoDB
```

يجب أن ترى:
```
STATE: RUNNING
```

### 4️⃣ بدء استخدام MongoDB

```powershell
# الاتصال بـ MongoDB
mongosh

# أو
mongo
```

يجب أن ترى:
```
>
```

**✅ تم! MongoDB يعمل الآن**

---

### إذا لم تعمل الخدمة تلقائياً:

```powershell
# بدء الخدمة
net start MongoDB

# إيقاف الخدمة
net stop MongoDB

# إعادة تشغيل
net stop MongoDB
net start MongoDB
```

---

## الطريقة 2: MongoDB Compass (GUI)

إذا كنت تفضل واجهة رسومية:

1. نزل MongoDB Compass من نفس الصفحة
2. ثبت البرنامج
3. افتح Compass
4. اتصل بـ: `mongodb://localhost:27017`

---

# macOS

## الطريقة 1: باستخدام Homebrew (موصى به)

### 1️⃣ تثبيت Homebrew (إذا لم يكن مثبت)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2️⃣ تثبيت MongoDB

```bash
# إضافة tap
brew tap mongodb/brew

# تثبيت MongoDB
brew install mongodb-community@7.0
```

### 3️⃣ بدء MongoDB

```bash
# بدء MongoDB كـ Service
brew services start mongodb-community@7.0

# أو تشغيل مباشر:
mongod --config /usr/local/etc/mongod.conf
```

### 4️⃣ التحقق من التثبيت

```bash
# التحقق من النسخة
mongod --version

# الاتصال بـ MongoDB
mongosh
```

### 5️⃣ أوامر مفيدة

```bash
# إيقاف MongoDB
brew services stop mongodb-community@7.0

# إعادة التشغيل
brew services restart mongodb-community@7.0

# التحقق من الحالة
brew services list
```

**✅ تم! MongoDB يعمل الآن**

---

# Linux (Ubuntu/Debian)

## للإصدار Ubuntu 22.04 / 20.04 / Debian

### 1️⃣ تحديث النظام

```bash
sudo apt update
sudo apt upgrade -y
```

### 2️⃣ استيراد GPG Key

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
```

### 3️⃣ إضافة MongoDB Repository

**لـ Ubuntu 22.04:**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

**لـ Ubuntu 20.04:**
```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

### 4️⃣ تثبيت MongoDB

```bash
sudo apt update
sudo apt install -y mongodb-org
```

### 5️⃣ بدء MongoDB

```bash
# بدء الخدمة
sudo systemctl start mongod

# تفعيل البدء التلقائي
sudo systemctl enable mongod

# التحقق من الحالة
sudo systemctl status mongod
```

يجب أن ترى:
```
● mongod.service - MongoDB Database Server
     Loaded: loaded
     Active: active (running)
```

### 6️⃣ التحقق من التثبيت

```bash
# النسخة
mongod --version

# الاتصال
mongosh
```

### 7️⃣ أوامر مفيدة

```bash
# إيقاف MongoDB
sudo systemctl stop mongod

# إعادة التشغيل
sudo systemctl restart mongod

# التحقق من الحالة
sudo systemctl status mongod

# عرض الـ logs
sudo journalctl -u mongod
```

**✅ تم! MongoDB يعمل الآن**

---

# Docker (أسهل طريقة) ⭐

## المميزات:
- ✅ لا يتطلب تثبيت على النظام
- ✅ يعمل على كل أنظمة التشغيل
- ✅ سهل الحذف والتنظيف
- ✅ عزل كامل عن النظام

### 1️⃣ تثبيت Docker

**Windows/Mac:**
- نزل Docker Desktop: https://www.docker.com/products/docker-desktop

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2️⃣ تشغيل MongoDB

```bash
# تشغيل MongoDB في Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

**شرح الأمر:**
- `-d`: تشغيل في الخلفية
- `--name mongodb`: تسمية الـ container
- `-p 27017:27017`: ربط المنفذ
- `-v mongodb_data:/data/db`: حفظ البيانات
- `mongo:latest`: أحدث نسخة من MongoDB

### 3️⃣ التحقق من العمل

```bash
# التحقق من أن Container يعمل
docker ps

# الاتصال بـ MongoDB
docker exec -it mongodb mongosh
```

### 4️⃣ أوامر مفيدة

```bash
# إيقاف MongoDB
docker stop mongodb

# بدء MongoDB
docker start mongodb

# إعادة التشغيل
docker restart mongodb

# عرض الـ logs
docker logs mongodb

# حذف Container (البيانات تبقى محفوظة)
docker rm -f mongodb

# حذف كل شيء (بما فيها البيانات)
docker rm -f mongodb
docker volume rm mongodb_data
```

### 5️⃣ استخدام Docker Compose (موصى به)

أنشئ ملف `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password123
    restart: unless-stopped

volumes:
  mongodb_data:
```

**تشغيل:**
```bash
# بدء
docker-compose up -d

# إيقاف
docker-compose down

# عرض logs
docker-compose logs -f
```

**✅ تم! MongoDB يعمل في Docker**

---

# MongoDB Atlas (Cloud - مجاناً) ☁️

## المميزات:
- ✅ **مجاني تماماً** (512 MB)
- ✅ لا يتطلب تثبيت
- ✅ يعمل من أي مكان
- ✅ Backup تلقائي
- ✅ موصى به للتطوير

### 1️⃣ إنشاء حساب

1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. سجل حساب جديد (مجاناً)
3. أكد البريد الإلكتروني

### 2️⃣ إنشاء Cluster

1. اضغط **"Build a Database"**
2. اختر **"M0 FREE"** (512 MB مجاناً)
3. اختر المنطقة الأقرب لك (مثلاً: AWS / Frankfurt)
4. سمِّ الـ Cluster (مثلاً: `child-growth-db`)
5. اضغط **"Create"**

### 3️⃣ إعداد الوصول

**Security → Database Access:**
1. اضغط **"Add New Database User"**
2. Username: `admin`
3. Password: اختر كلمة مرور قوية
4. User Privileges: **"Read and write to any database"**
5. اضغط **"Add User"**

**Security → Network Access:**
1. اضغط **"Add IP Address"**
2. اضغط **"Allow Access from Anywhere"**
3. (أو أدخل IP محدد للأمان)
4. اضغط **"Confirm"**

### 4️⃣ الحصول على Connection String

1. اذهب **Database** → اضغط **"Connect"**
2. اختر **"Connect your application"**
3. اختر **Driver:** Node.js
4. **Version:** أحدث إصدار
5. انسخ الـ Connection String:

```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 5️⃣ استخدام في المشروع

افتح `backend/.env`:

```env
MONGODB_URI=mongodb+srv://admin:كلمة_المرور@cluster0.xxxxx.mongodb.net/child-growth-system?retryWrites=true&w=majority
```

**⚠️ هام:** استبدل `<password>` بكلمة المرور!

### 6️⃣ التحقق من الاتصال

```bash
cd backend
npm run dev
```

يجب أن ترى:
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

**✅ تم! MongoDB Atlas يعمل الآن**

---

# 🔧 استكشاف الأخطاء

## ❌ "mongod: command not found"

**الحل:**

**Windows:**
أضف MongoDB للـ PATH:
```
C:\Program Files\MongoDB\Server\7.0\bin
```

**Mac:**
```bash
brew link mongodb-community@7.0
```

**Linux:**
```bash
sudo systemctl start mongod
```

---

## ❌ "Failed to connect to 127.0.0.1:27017"

**الحل:**

```bash
# Linux/Mac
sudo systemctl start mongod

# Windows
net start MongoDB

# Docker
docker start mongodb
```

---

## ❌ "Data directory /data/db not found"

**الحل:**

```bash
# Linux/Mac
sudo mkdir -p /data/db
sudo chown -R $USER:$USER /data/db

# أو حدد مسار آخر:
mongod --dbpath ~/mongodb-data
```

---

## ❌ "Port 27017 already in use"

**الحل:**

```bash
# معرفة العملية المستخدمة
sudo lsof -i :27017

# إيقافها
sudo kill -9 <PID>

# أو استخدم port آخر
mongod --port 27018
```

---

# ✅ التحقق من نجاح التثبيت

## اختبار سريع:

```bash
# 1. التحقق من النسخة
mongod --version

# 2. الاتصال بـ MongoDB
mongosh

# 3. إنشاء database تجريبي
> use testdb
> db.test.insertOne({message: "Hello MongoDB"})
> db.test.find()

# يجب أن ترى:
{ _id: ObjectId("..."), message: 'Hello MongoDB' }

# 4. الخروج
> exit
```

---

# 📊 مقارنة الطرق

| الطريقة | المميزات | العيوب | موصى به لـ |
|---------|----------|---------|------------|
| **تثبيت عادي** | أداء أفضل، تحكم كامل | يتطلب تثبيت | Production |
| **Docker** | سهل، نظيف، محمول | يتطلب Docker | Development |
| **Atlas** | مجاني، سحابي، آمن | يتطلب إنترنت | Development/Testing |

---

# 🚀 الطريقة الموصى بها لمشروعنا

## للتطوير (Development):

**استخدم Docker أو MongoDB Atlas**

لماذا؟
- ✅ سهل التثبيت
- ✅ لا يؤثر على نظامك
- ✅ سهل الحذف

## للإنتاج (Production):

**استخدم التثبيت العادي أو MongoDB Atlas (خطة مدفوعة)**

---

# 🎯 الآن ماذا؟

بعد تثبيت MongoDB:

### 1️⃣ عد لمشروع رفيق النمو:

```bash
cd child-growth-system/backend
npm install
npm run setup
npm run dev
```

### 2️⃣ يجب أن ترى:

```
✅ MongoDB Connected: localhost:27017
👤 Creating default admin user...
✅ Default user created:
   Username: admin
   Password: 123456

Server running on port 5000
```

### 3️⃣ افتح المتصفح:

```
http://localhost:3000
```

---

# 📚 موارد إضافية

- **Documentation:** https://www.mongodb.com/docs/
- **MongoDB University:** https://learn.mongodb.com/ (دورات مجانية)
- **MongoDB Compass:** https://www.mongodb.com/products/compass (GUI Tool)

---

**🎉 تهانينا! MongoDB جاهز للاستخدام الآن**

العودة إلى: [ZERO-CONFIG-SETUP.md](ZERO-CONFIG-SETUP.md)
