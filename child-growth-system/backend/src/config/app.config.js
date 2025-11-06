module.exports = {
  app: {
    name: 'رفيق النمو - Child Growth System',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    url: process.env.APP_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/child-growth-system'
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expire: process.env.JWT_EXPIRE || '30d'
  },

  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-3-5-sonnet-20241022'
    }
  },

  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    units: 'metric',
    lang: 'ar'
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },

  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-sessions'
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};
