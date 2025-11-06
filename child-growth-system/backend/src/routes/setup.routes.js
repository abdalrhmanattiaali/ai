const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// @desc    Check if system is already setup
// @route   GET /api/setup/status
router.get('/status', (req, res) => {
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
  const hasDatabase = envContent.includes('DB_HOST') && envContent.includes('DB_NAME');
  const hasAdmin = envContent.includes('SETUP_COMPLETE=true');

  res.json({
    isSetup: hasAdmin,
    hasDatabase: hasDatabase,
    message: hasAdmin ? 'System is ready' : 'Setup incomplete'
  });
});

// @desc    Save setup configuration
// @route   POST /api/setup/configure
router.post('/configure', async (req, res) => {
  try {
    const {
      // Database
      dbType,
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbPassword,

      // APIs
      openaiKey,
      weatherKey,

      // Email
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,

      // Admin User
      adminUsername,
      adminEmail,
      adminPassword
    } = req.body;

    // Build .env content
    const envContent = `# ========================================
# 🌟 رفيق النمو - Auto-Generated Config
# ========================================
# تم إنشاء هذا الملف تلقائياً بواسطة Setup Wizard
# تاريخ: ${new Date().toLocaleString('ar-EG')}
# ========================================

# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_TYPE=${dbType || 'mysql'}
DB_HOST=${dbHost || 'localhost'}
DB_PORT=${dbPort || '3306'}
DB_NAME=${dbName || 'child_growth_system'}
DB_USER=${dbUser || 'root'}
DB_PASSWORD=${dbPassword || ''}

# Legacy MongoDB URI (للتوافق)
MONGODB_URI=mongodb://localhost:27017/child-growth-system

# JWT
JWT_SECRET=${generateRandomString(32)}
JWT_EXPIRE=30d

# OpenAI API
OPENAI_API_KEY=${openaiKey || ''}

# Weather API
OPENWEATHER_API_KEY=${weatherKey || ''}

# Email Configuration
SMTP_HOST=${smtpHost || 'smtp.gmail.com'}
SMTP_PORT=${smtpPort || '587'}
SMTP_USER=${smtpUser || ''}
SMTP_PASS=${smtpPass || ''}

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# WhatsApp
WHATSAPP_SESSION_PATH=./whatsapp-sessions

# Admin User (from setup)
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

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      nextStep: 'database-test'
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Test database connection
// @route   POST /api/setup/test-database
router.post('/test-database', async (req, res) => {
  try {
    const { dbType, dbHost, dbPort, dbName, dbUser, dbPassword } = req.body;

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

      res.json({
        success: true,
        message: 'تم الاتصال بقاعدة البيانات بنجاح ✅'
      });
    } else {
      res.json({
        success: true,
        message: 'Database type not implemented yet'
      });
    }

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'فشل الاتصال بقاعدة البيانات ❌'
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

    // Test with a simple request
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

// @desc    Create admin user
// @route   POST /api/setup/create-admin
router.post('/create-admin', async (req, res) => {
  try {
    // This will be implemented after database setup
    res.json({
      success: true,
      message: 'Admin user will be created on first run'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
