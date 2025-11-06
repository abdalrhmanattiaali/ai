const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// @desc    Check if system is already setup
// @route   GET /api/setup/status
router.get('/status', (req, res) => {
  try {
    const envPath = path.join(__dirname, '../../.env');
    const envExists = fs.existsSync(envPath);

    if (!envExists) {
      return res.json({
        isSetup: false,
        message: 'System needs setup'
      });
    }

    // Check if setup is complete
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasAdmin = envContent.includes('SETUP_COMPLETE=true');

    res.json({
      isSetup: hasAdmin,
      message: hasAdmin ? 'System is ready' : 'Setup incomplete'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.json({
      isSetup: false,
      message: 'System needs setup'
    });
  }
});

// @desc    Save setup configuration
// @route   POST /api/setup/configure
router.post('/configure', async (req, res) => {
  try {
    console.log('📥 Received setup configuration');

    const {
      dbType,
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbPassword,
      openaiKey,
      weatherKey,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      adminUsername,
      adminEmail,
      adminPassword
    } = req.body;

    console.log('✅ Parsed request body');

    // Build .env content
    const envContent = `# Auto-Generated Config
# تم إنشاء هذا الملف تلقائياً
# ${new Date().toLocaleString()}

# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
DB_TYPE=${dbType || 'sqlite'}
${dbType === 'sqlite' ? 'DB_PATH=./database.sqlite' : `DB_HOST=${dbHost || 'localhost'}
DB_PORT=${dbPort || '3306'}
DB_NAME=${dbName || 'child_growth_system'}
DB_USER=${dbUser || 'root'}
DB_PASSWORD=${dbPassword || ''}`}

# JWT
JWT_SECRET=${generateRandomString(32)}
JWT_EXPIRE=30d

# OpenAI
OPENAI_API_KEY=${openaiKey || ''}

# Weather
OPENWEATHER_API_KEY=${weatherKey || ''}

# Email
SMTP_HOST=${smtpHost || 'smtp.gmail.com'}
SMTP_PORT=${smtpPort || '587'}
SMTP_USER=${smtpUser || ''}
SMTP_PASS=${smtpPass || ''}

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp-sessions

# Admin User
ADMIN_USERNAME=${adminUsername}
ADMIN_EMAIL=${adminEmail}
ADMIN_PASSWORD=${adminPassword}

# Setup Status
SETUP_COMPLETE=true
SETUP_DATE=${new Date().toISOString()}
`;

    // Save .env file
    const envPath = path.join(__dirname, '../../.env');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created');

    // Reload environment variables
    require('dotenv').config({ path: envPath });
    console.log('✅ Environment variables reloaded');

    // Send success response immediately
    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح! ✅',
      dbType: dbType || 'sqlite'
    });

    console.log('✅ Response sent to client');

    // Initialize database in background
    setTimeout(async () => {
      try {
        console.log('🔄 Initializing database...');
        const finalDbType = dbType || 'sqlite';

        if (finalDbType === 'sqlite') {
          const seedSQLite = require('../utils/seed.sqlite');
          await seedSQLite();
          console.log('✅ SQLite database initialized');
        } else if (finalDbType === 'mysql') {
          const seedMySQL = require('../utils/seed.mysql');
          await seedMySQL();
          console.log('✅ MySQL database initialized');
        }
      } catch (dbError) {
        console.error('⚠️  Database initialization error:', dbError.message);
        console.log('💡 Please restart the server to complete setup');
      }
    }, 500);

  } catch (error) {
    console.error('❌ Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'فشل في حفظ الإعدادات'
    });
  }
});

// @desc    Test database connection
// @route   POST /api/setup/test-database
router.post('/test-database', async (req, res) => {
  try {
    const { dbType, dbHost, dbPort, dbName, dbUser, dbPassword } = req.body;

    if (dbType === 'sqlite') {
      return res.json({
        success: true,
        message: 'SQLite لا يحتاج اختبار - جاهز للاستخدام! ✅'
      });
    }

    if (dbType === 'mysql') {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort || 3306,
        user: dbUser,
        password: dbPassword,
        database: dbName
      });

      await connection.ping();
      await connection.end();

      return res.json({
        success: true,
        message: 'تم الاتصال بقاعدة البيانات بنجاح ✅'
      });
    }

    res.json({
      success: false,
      message: 'نوع قاعدة البيانات غير مدعوم'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'فشل الاتصال بقاعدة البيانات ❌'
    });
  }
});

// @desc    Create new database
// @route   POST /api/setup/create-database
router.post('/create-database', async (req, res) => {
  try {
    const { dbType, dbHost, dbPort, dbName, rootUser, rootPassword } = req.body;

    if (dbType === 'mysql') {
      const mysql = require('mysql2/promise');

      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort || 3306,
        user: rootUser,
        password: rootPassword
      });

      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );

      await connection.end();

      return res.json({
        success: true,
        message: `تم إنشاء قاعدة البيانات "${dbName}" بنجاح ✅`
      });
    }

    res.json({
      success: false,
      message: 'نوع قاعدة البيانات غير مدعوم'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'فشل إنشاء قاعدة البيانات ❌'
    });
  }
});

// @desc    Test OpenAI API
// @route   POST /api/setup/test-openai
router.post('/test-openai', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API Key مطلوب'
      });
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });

    res.json({
      success: true,
      message: 'OpenAI API يعمل بنجاح ✅'
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'فشل الاتصال بـ OpenAI ❌'
    });
  }
});

// Helper function
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;
