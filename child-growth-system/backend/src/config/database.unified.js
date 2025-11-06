const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbType = process.env.DB_TYPE || 'mongodb';

let connectDB;

if (dbType === 'mysql') {
  // استخدام MySQL/Sequelize
  const { connectSequelize } = require('./sequelize.config');
  connectDB = connectSequelize;

  console.log('📊 Database Type: MySQL (Sequelize)');
} else {
  // استخدام MongoDB/Mongoose
  const connectMongoDB = require('./database');
  connectDB = connectMongoDB;

  console.log('📊 Database Type: MongoDB (Mongoose)');
}

module.exports = connectDB;
