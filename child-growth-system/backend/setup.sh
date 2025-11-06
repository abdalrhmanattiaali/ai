#!/bin/bash

# 🚀 سكريبت إعداد سريع لرفيق النمو

echo "================================"
echo "🌟 رفيق النمو - Setup Script"
echo "================================"
echo ""

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيته من: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo ""

# التحقق من MongoDB
echo "🔍 التحقق من MongoDB..."

# محاولة الاتصال بـ MongoDB
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo "✅ MongoDB يعمل"
    else
        echo "⚠️  MongoDB غير متصل"
        echo ""
        echo "💡 لتشغيل MongoDB:"
        echo ""
        echo "   خيار 1 - محلي:"
        echo "   sudo systemctl start mongod"
        echo ""
        echo "   خيار 2 - Docker:"
        echo "   docker run -d -p 27017:27017 --name mongodb mongo"
        echo ""
        echo "   خيار 3 - MongoDB Atlas (Cloud):"
        echo "   راجع: MONGODB-INSTALL.md"
        echo ""
        read -p "هل تريد المتابعة؟ (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  لا يمكن التحقق من MongoDB (mongosh غير مثبت)"
    echo "   سنحاول الاتصال على أي حال..."
fi

echo ""

# التحقق من .env
if [ ! -f .env ]; then
    echo "📝 إنشاء ملف .env..."
    cp .env.example .env
    echo "✅ تم إنشاء .env"
else
    echo "✅ ملف .env موجود"
fi

echo ""

# تثبيت Dependencies
echo "📦 تثبيت Dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ فشل تثبيت dependencies"
    echo "💡 جرب: npm install --legacy-peer-deps"
    exit 1
fi

echo "✅ تم تثبيت dependencies"
echo ""

# إنشاء المجلدات المطلوبة
echo "📁 إنشاء المجلدات..."
mkdir -p whatsapp-sessions uploads logs
echo "✅ تم إنشاء المجلدات"
echo ""

# تشغيل Seeder
echo "🌱 إنشاء المستخدم الافتراضي..."
npm run setup

echo ""
echo "================================"
echo "🎉 الإعداد مكتمل!"
echo "================================"
echo ""
echo "🚀 لتشغيل Backend:"
echo "   npm run dev"
echo ""
echo "📝 بيانات الدخول:"
echo "   Username: admin"
echo "   Password: 123456"
echo ""
echo "🌐 URL:"
echo "   http://localhost:3000"
echo ""
