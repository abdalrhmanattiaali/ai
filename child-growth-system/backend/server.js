require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./src/app');
const whatsappService = require('./src/services/whatsapp.service');
const appConfig = require('./src/config/app.config');

const PORT = appConfig.app.port;

// Check if system is set up
const envPath = path.join(__dirname, '.env');
const isSetup = fs.existsSync(envPath) && fs.readFileSync(envPath, 'utf8').includes('SETUP_COMPLETE=true');

// Connect to database only if setup is complete
if (isSetup) {
  const dbType = process.env.DB_TYPE || 'sqlite';
  let connectDB;

  if (dbType === 'sqlite') {
    const { connectSequelize } = require('./src/config/sequelize.config');
    connectDB = connectSequelize;
    console.log('📁 Using SQLite database');
  } else if (dbType === 'mysql') {
    const { connectSequelize } = require('./src/config/sequelize.config');
    connectDB = connectSequelize;
    console.log('🗄️  Using MySQL database');
  } else if (dbType === 'mongodb') {
    connectDB = require('./src/config/database');
    console.log('🍃 Using MongoDB database');
  }

  // Connect with error handling
  if (connectDB) {
    connectDB().catch(err => {
      console.error('⚠️  Database connection failed:', err.message);
      console.log('💡 Server will continue running. Please check your database configuration.');
    });
  }
} else {
  console.log('⚙️  System not set up yet. Please visit http://localhost:3000/setup');
}

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: appConfig.app.frontendUrl,
    credentials: true
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// ربط Socket.IO مع WhatsApp Service
whatsappService.setEventEmitter(io);

// Make io accessible to routes
app.set('io', io);

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║     🌟 رفيق النمو - Child Growth System      ║
║                                               ║
║     Server running on port ${PORT}            ║
║     Environment: ${appConfig.app.env}         ║
║     Frontend: ${appConfig.app.frontendUrl}    ║
║     ${isSetup ? 'Status: ✅ Ready' : 'Status: ⚙️  Needs Setup'}              ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);

  if (!isSetup) {
    console.log('');
    console.log('👉 Please complete the setup wizard:');
    console.log('   http://localhost:3000/setup');
    console.log('');
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Don't exit server if it's just a database connection issue
  if (!err.message.includes('database') && !err.message.includes('connect')) {
    server.close(() => process.exit(1));
  }
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  await whatsappService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
