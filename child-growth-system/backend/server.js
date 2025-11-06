require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const whatsappService = require('./src/services/whatsapp.service');
const appConfig = require('./src/config/app.config');

const PORT = appConfig.app.port;

// Connect to database (supports both MySQL and MongoDB)
const dbType = process.env.DB_TYPE || 'mongodb';
let connectDB;

if (dbType === 'mysql') {
  const { connectSequelize } = require('./src/config/sequelize.config');
  connectDB = connectSequelize;
  console.log('📊 Using MySQL database');
} else {
  connectDB = require('./src/config/database');
  console.log('📊 Using MongoDB database');
}

connectDB();

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
║                                               ║
╚═══════════════════════════════════════════════╝
  `);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
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
