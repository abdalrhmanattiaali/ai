# 📡 API Documentation - نبراس المؤمنين

وثائق كاملة لجميع نقاط النهاية (Endpoints) في النظام.

**Base URL:** `http://localhost:3000/api`

---

## 📑 جدول المحتويات

1. [المستخدمون (Users)](#users)
2. [الرسائل (Messages)](#messages)
3. [أوقات الصلاة (Prayer Times)](#prayer-times)
4. [الذكاء الاصطناعي (AI)](#ai)
5. [لوحة التحكم (Dashboard)](#dashboard)

---

## 🧑‍🤝‍🧑 Users

### GET /api/users
الحصول على كل المستخدمين

**Response:**
```json
{
  "success": true,
  "count": 15,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "أحمد محمد",
      "phone": "+201234567890",
      "status": "active",
      "profile": {
        "level": "متوسط",
        "goals": ["المحافظة على الفجر"]
      },
      "stats": {
        "totalPoints": 2840,
        "currentStreak": 15,
        "level": 3
      }
    }
  ]
}
```

---

### GET /api/users/:id
الحصول على مستخدم محدد

**Parameters:**
- `id` (path) - معرف المستخدم

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "أحمد محمد",
    "phone": "+201234567890",
    ...
  }
}
```

---

### POST /api/users
إضافة مستخدم جديد

**Request Body:**
```json
{
  "name": "محمد علي",
  "phone": "+201234567890",
  "profile": {
    "level": "متوسط",
    "goals": ["قيام الليل", "ختم القرآن"],
    "weakPoints": ["صلاة الفجر"]
  },
  "location": {
    "city": "Cairo",
    "country": "Egypt",
    "timezone": "Africa/Cairo"
  },
  "routine": {
    "wakeUpTime": "05:00",
    "sleepTime": "23:00",
    "workHours": {
      "start": "09:00",
      "end": "17:00"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "محمد علي",
    ...
  }
}
```

**Notes:**
- يتم إرسال رسالة ترحيب تلقائياً للمستخدم الجديد
- الحقول المطلوبة: `name`, `phone`

---

### PUT /api/users/:id
تحديث مستخدم

**Request Body:** (أي حقل تريد تحديثه)
```json
{
  "status": "paused",
  "profile": {
    "level": "متقدم"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### DELETE /api/users/:id
حذف مستخدم

**Response:**
```json
{
  "success": true,
  "message": "تم حذف المستخدم"
}
```

---

### GET /api/users/:id/stats
إحصائيات مستخدم محدد

**Response:**
```json
{
  "success": true,
  "stats": {
    "user": {
      "name": "أحمد محمد",
      "level": 3,
      "points": 2840,
      "currentStreak": 15,
      "longestStreak": 40
    },
    "weekly": {
      "prayers": [
        {
          "_id": "فجر",
          "total": 7,
          "onTime": 6,
          "missed": 1,
          "totalPoints": 60
        }
      ],
      "quran": {
        "totalPages": 45,
        "totalSessions": 12,
        "avgPages": 3.75
      }
    }
  }
}
```

---

## 💬 Messages

### POST /api/messages/send
إرسال رسالة لمستخدم واحد

**Request Body:**
```json
{
  "phone": "+201234567890",
  "message": "السلام عليكم، هذا تذكير بصلاة العشاء"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال الرسالة"
}
```

---

### POST /api/messages/broadcast
إرسال رسالة جماعية لكل المستخدمين النشطين

**Request Body:**
```json
{
  "message": "🌙 رمضان كريم! لا تنسوا قراءة القرآن اليوم"
}
```

**Response:**
```json
{
  "success": true,
  "sent": 12,
  "failed": 1,
  "total": 13
}
```

**Notes:**
- يتم إرسال الرسائل بفاصل 2 ثانية بين كل رسالة لتجنب الحظر
- فقط المستخدمون بحالة `active` يستقبلون الرسائل

---

### POST /api/messages/group
إرسال رسالة لمجموعة واتساب

**Request Body:**
```json
{
  "groupId": "120363xxx@g.us",
  "message": "📊 إحصائيات المجموعة الأسبوعية..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال الرسالة للمجموعة"
}
```

**Notes:**
- معرف المجموعة يمكن الحصول عليه من رسائل المجموعة في الواتساب

---

## 🕌 Prayer Times

### GET /api/prayer-times
أوقات الصلاة لمدينة محددة

**Query Parameters:**
- `city` (default: Cairo)
- `country` (default: Egypt)

**Example:**
```
GET /api/prayer-times?city=Riyadh&country=Saudi Arabia
```

**Response:**
```json
{
  "success": true,
  "times": {
    "timings": {
      "Fajr": "04:30",
      "Sunrise": "05:52",
      "Dhuhr": "12:15",
      "Asr": "15:38",
      "Maghrib": "18:37",
      "Isha": "20:07"
    },
    "hijriDate": {
      "day": "15",
      "month": {
        "ar": "رمضان"
      },
      "year": "1446"
    },
    "gregorianDate": {
      "day": "15",
      "month": "03",
      "year": "2024"
    }
  }
}
```

---

### GET /api/hijri-date
التاريخ الهجري والمناسبات الإسلامية

**Response:**
```json
{
  "success": true,
  "hijri": {
    "day": 15,
    "month": "رمضان",
    "monthNumber": 9,
    "year": 1446,
    "formatted": "15 رمضان 1446"
  },
  "occasions": [
    {
      "name": "رمضان",
      "type": "month",
      "description": "شهر رمضان المبارك"
    },
    {
      "name": "ليلة القدر المحتملة",
      "type": "special",
      "description": "الليلة 15 من رمضان"
    }
  ]
}
```

---

## 🤖 AI

### POST /api/ai/analyze
تحليل سلوك مستخدم بواسطة Claude AI

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "strengths": [
      "محافظ على صلاة الظهر والعصر بنسبة 100%",
      "يقرأ القرآن بانتظام"
    ],
    "weaknesses": [
      "صلاة الفجر تتأخر غالباً",
      "الأذكار اليومية غير منتظمة"
    ],
    "trends": {
      "prayers": "تحسن",
      "quran": "ثابت",
      "overall": "تحسن"
    },
    "patterns": [
      "يفوت الفجر غالباً يوم الإثنين"
    ],
    "recommendations": [
      {
        "title": "تحسين صلاة الفجر",
        "description": "جرب النوم مبكراً الساعة 10 مساءً",
        "priority": "high"
      }
    ],
    "overallScore": 7.5,
    "summary": "أداء جيد بشكل عام مع تحسن ملحوظ في الأسبوعين الأخيرين"
  }
}
```

---

### POST /api/ai/advice
نصائح مخصصة من Claude AI

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "advice": {
    "advice": [
      {
        "problem": "صلاة الفجر",
        "solution": "نم قبل 11 مساءً واضبط 3 منبهات",
        "motivation": "الفجر في وقته يعدل قيام الليل",
        "duration": "7 أيام",
        "priority": "high"
      },
      {
        "problem": "الأذكار",
        "solution": "اربط أذكار الصباح بفنجان القهوة",
        "motivation": "حصن من الشيطان طوال اليوم",
        "duration": "14 يوماً",
        "priority": "medium"
      }
    ]
  }
}
```

---

### POST /api/ai/content
توليد محتوى ديني من ChatGPT

**Request Body:**
```json
{
  "type": "آية",
  "context": {
    "occasion": "رمضان",
    "level": "متوسط"
  }
}
```

**Types:**
- `آية` - آية قرآنية
- `حديث` - حديث نبوي
- `دعاء` - دعاء مأثور
- `ذكر` - ذكر
- `درس` - درس ديني
- `فائدة` - فائدة قصيرة

**Response (آية):**
```json
{
  "success": true,
  "content": {
    "ayah": "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ...",
    "surah": "البقرة",
    "ayahNumber": 183,
    "tafsir": "فرض الله الصيام على المؤمنين...",
    "benefit": "الصيام تدريب على التقوى وكسر الشهوات"
  }
}
```

---

### POST /api/ai/ask
إجابة سؤال شرعي من ChatGPT

**Request Body:**
```json
{
  "question": "ما هو فضل صلاة الفجر في جماعة؟",
  "level": "متوسط"
}
```

**Response:**
```json
{
  "success": true,
  "question": "ما هو فضل صلاة الفجر في جماعة؟",
  "answer": "صلاة الفجر في جماعة لها فضل عظيم:\n\n1. قال النبي ﷺ: \"من صلى الفجر في جماعة فكأنما قام الليل كله\" (رواه مسلم)\n\n2. من صلى العشاء في جماعة فكأنما قام نصف الليل، ومن صلى الفجر في جماعة فكأنما قام الليل كله\n\n3. المحافظة عليها سبب لدخول الجنة\n\n4. في ذمة الله حتى يمسي\n\nوالله أعلم."
}
```

---

## 📊 Dashboard

### GET /api/dashboard/stats
إحصائيات عامة للوحة التحكم

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 25,
    "activeUsers": 20,
    "todayPrayers": 68,
    "totalPoints": 42500,
    "topUsers": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "أحمد محمد",
        "stats": {
          "totalPoints": 3240,
          "currentStreak": 45
        }
      }
    ]
  }
}
```

---

## 🔒 Error Responses

جميع الـ Endpoints تُرجع أخطاء بهذا التنسيق:

```json
{
  "success": false,
  "error": "وصف الخطأ"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Notes

### Rate Limiting
- حالياً لا يوجد Rate Limiting
- في Production، ستحتاج لإضافة Rate Limiter

### Authentication
- حالياً لا يوجد Authentication
- في Production، استخدم JWT أو OAuth

### Pagination
- حالياً لا يوجد Pagination
- يمكن إضافة `?page=1&limit=10` لاحقاً

---

## 🧪 مثال على الاستخدام (cURL)

```bash
# إضافة مستخدم
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"أحمد","phone":"+201234567890"}'

# إرسال رسالة
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+201234567890","message":"السلام عليكم"}'

# أوقات الصلاة
curl "http://localhost:3000/api/prayer-times?city=Cairo"

# تحليل AI
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"userId":"507f1f77bcf86cd799439011"}'
```

---

**تم إنشاء هذه الوثائق بحب 💚**

للمزيد من المعلومات، راجع [README.md](README.md) أو [SETUP.md](SETUP.md)
