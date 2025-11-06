# 🌟 رفيق النمو - Child Growth Tracking System via WhatsApp

نظام ذكي متكامل لمتابعة ومرافقة تطور الأطفال من خلال إرسال رسائل واتساب تفاعلية مدعومة بالذكاء الاصطناعي، مع لوحة تحكم شاملة لإدارة كل جوانب النظام.

## ✨ المميزات الرئيسية

- 🤖 **ذكاء اصطناعي متقدم** - محادثات ذكية مدعومة بـ GPT-4
- 📱 **تكامل WhatsApp** - إرسال واستقبال رسائل عبر WhatsApp
- 🧠 **ذاكرة طويلة المدى** - يتذكر كل التفاصيل والتفاعلات
- 👶 **متابعة شاملة** - تتبع نمو وتطور الأطفال
- 📊 **تقارير تفصيلية** - تحليلات ورسوم بيانية للنمو
- 🌤️ **تكامل الطقس** - اقتراحات مخصصة حسب الطقس
- ⏰ **جدولة ذكية** - رسائل تلقائية مجدولة
- 🎯 **توصيات مخصصة** - أنشطة وتوصيات مبنية على AI

## 🏗️ البنية التقنية

### Backend
- **Node.js** + **Express.js** - API Server
- **MongoDB** - قاعدة البيانات
- **whatsapp-web.js** - تكامل WhatsApp
- **OpenAI GPT-4** - الذكاء الاصطناعي
- **Socket.io** - Real-time communication
- **Redis** - Caching (optional)
- **Bull** - Job Queue

### Frontend
- **Next.js 14** - React Framework
- **Tailwind CSS** - Styling
- **TypeScript** - Type Safety
- **Socket.io-client** - Real-time updates
- **Zustand** - State Management
- **React Query** - Data Fetching

## 📋 المتطلبات

- Node.js v20+
- MongoDB v7+
- Redis v7+ (optional)
- OpenAI API Key
- حساب WhatsApp

## 🚀 التثبيت والإعداد

### 1. استنساخ المشروع

\`\`\`bash
git clone <repository-url>
cd child-growth-system
\`\`\`

### 2. إعداد Backend

\`\`\`bash
cd backend

# تثبيت Dependencies
npm install

# نسخ ملف البيئة
cp .env.example .env

# تعديل .env وإضافة المتغيرات المطلوبة:
# - MONGODB_URI
# - JWT_SECRET
# - OPENAI_API_KEY
# - OPENWEATHER_API_KEY (optional)

# تشغيل Backend
npm run dev
\`\`\`

Backend سيعمل على: `http://localhost:5000`

### 3. إعداد Frontend

\`\`\`bash
cd frontend

# تثبيت Dependencies
npm install

# نسخ ملف البيئة
cp .env.local.example .env.local

# تشغيل Frontend
npm run dev
\`\`\`

Frontend سيعمل على: `http://localhost:3000`

### 4. إعداد MongoDB

تأكد من تشغيل MongoDB:

\`\`\`bash
# إذا كنت تستخدم Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# أو إذا كان مثبت محلياً
mongod
\`\`\`

## 📱 ربط WhatsApp

1. سجل الدخول للداشبورد
2. اذهب إلى صفحة "ربط WhatsApp"
3. اضغط على "بدء الاتصال"
4. امسح رمز QR باستخدام تطبيق WhatsApp:
   - افتح WhatsApp
   - الإعدادات → الأجهزة المرتبطة → ربط جهاز
   - امسح الرمز

## 🔧 الإعداد الأولي

### 1. إنشاء حساب

\`\`\`
GET http://localhost:3000/register
\`\`\`

- أدخل اسم مستخدم وبريد إلكتروني وكلمة مرور
- سيتم تسجيل الدخول تلقائياً

### 2. ربط WhatsApp

- اذهب للداشبورد → ربط WhatsApp
- اتبع التعليمات لربط حسابك

### 3. إضافة أسرة

\`\`\`
POST /api/families
{
  "familyName": "أسرة أحمد",
  "location": {
    "city": "القاهرة",
    "country": "مصر"
  }
}
\`\`\`

### 4. إضافة طفل

\`\`\`
POST /api/children
{
  "familyId": "...",
  "fullName": "أحمد محمد",
  "nickname": "أحمد",
  "gender": "male",
  "birthDate": "2020-01-15"
}
\`\`\`

### 5. إضافة والد/والدة

\`\`\`
POST /api/parents
{
  "familyId": "...",
  "name": "محمد",
  "role": "father",
  "whatsappNumber": "+201234567890"
}
\`\`\`

## 📚 API Documentation

### Authentication

#### Register
\`\`\`
POST /api/auth/register
{
  "username": "user",
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

#### Login
\`\`\`
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

### WhatsApp

#### Initialize Connection
\`\`\`
POST /api/whatsapp/initialize
Authorization: Bearer <token>
\`\`\`

#### Get Status
\`\`\`
GET /api/whatsapp/status
Authorization: Bearer <token>
\`\`\`

#### Send Message
\`\`\`
POST /api/whatsapp/send-message
Authorization: Bearer <token>
{
  "phoneNumber": "+201234567890",
  "message": "مرحباً!",
  "familyId": "..."
}
\`\`\`

### Families

#### Get All Families
\`\`\`
GET /api/families
Authorization: Bearer <token>
\`\`\`

#### Create Family
\`\`\`
POST /api/families
Authorization: Bearer <token>
{
  "familyName": "أسرة أحمد",
  "location": {
    "city": "القاهرة"
  }
}
\`\`\`

## 🗂️ هيكل المشروع

\`\`\`
child-growth-system/
├── backend/
│   ├── src/
│   │   ├── config/          # ملفات الإعداد
│   │   ├── models/          # نماذج قاعدة البيانات
│   │   ├── controllers/     # Controllers
│   │   ├── services/        # Business Logic
│   │   │   ├── whatsapp.service.js
│   │   │   ├── ai.service.js
│   │   │   └── weather.service.js
│   │   ├── middleware/      # Middleware
│   │   ├── routes/          # API Routes
│   │   └── app.js
│   ├── whatsapp-sessions/   # WhatsApp sessions
│   ├── uploads/             # Uploaded files
│   ├── logs/                # Log files
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── whatsapp/
│   │   │       ├── families/
│   │   │       ├── children/
│   │   │       └── ...
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   └── public/
└── README.md
\`\`\`

## 🔐 الأمان

- 🔒 JWT Authentication
- 🛡️ Helmet.js للأمان
- 🚦 Rate Limiting
- 🔑 Password Hashing (bcrypt)
- ✅ Input Validation
- 🔐 CORS Protection

## 🌐 المتغيرات البيئية

### Backend (.env)

\`\`\`env
# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/child-growth-system

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# OpenAI
OPENAI_API_KEY=sk-...

# Weather (Optional)
OPENWEATHER_API_KEY=your-api-key

# Redis (Optional)
REDIS_URL=redis://localhost:6379
\`\`\`

### Frontend (.env.local)

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
\`\`\`

## 📊 قاعدة البيانات

النماذج الرئيسية:

- **User** - مستخدمي النظام (Admins)
- **Family** - الأسر المسجلة
- **Child** - الأطفال
- **Parent** - الوالدين
- **WhatsAppSession** - جلسات WhatsApp
- **MessageRecipient** - مستقبلي الرسائل
- **Conversation** - المحادثات
- **Recommendation** - التوصيات
- **Schedule** - جداول الإشعارات
- **GrowthRecord** - سجلات النمو
- **Activity** - الأنشطة المنجزة
- **MemoryContext** - ذاكرة النظام
- **MessageQueue** - طابور الرسائل

## 🤝 المساهمة

المساهمات مرحب بها! يرجى:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📝 الترخيص

MIT License

## 👨‍💻 المطور

مبني بكل ❤️ للآباء والأمهات

## 🐛 الإبلاغ عن مشكلة

إذا وجدت مشكلة، يرجى فتح Issue على GitHub

## 📞 الدعم

للدعم والاستفسارات، يرجى التواصل عبر:
- Email: support@example.com
- GitHub Issues

## 🎯 الخطط المستقبلية

- [ ] إضافة دعم متعدد اللغات
- [ ] تطبيق موبايل (React Native)
- [ ] تكامل مع Google Calendar
- [ ] نظام الإشعارات Push
- [ ] تحليلات متقدمة بـ AI
- [ ] تقارير PDF تلقائية
- [ ] نظام المكافآت للأطفال
- [ ] مجتمع الآباء

---

**نسخة 1.0.0** • مبني في 2024
