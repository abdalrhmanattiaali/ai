const { LocalAuth } = require('whatsapp-web.js');
const path = require('path');

const whatsappConfig = {
  authStrategy: new LocalAuth({
    clientId: 'main-session',
    dataPath: path.join(__dirname, '../../whatsapp-sessions')
  }),

  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  },

  qrMaxRetries: 5,
  restartOnAuthFail: true,

  // Webhook للإشعارات (optional)
  webhookUrl: process.env.WEBHOOK_URL || null
};

module.exports = whatsappConfig;
