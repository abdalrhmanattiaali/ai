const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'child-growth.db');
const db = new sqlite3.Database(dbPath);

// إنشاء الجداول
db.serialize(() => {
  // جدول معلومات الطفل
  db.run(`
    CREATE TABLE IF NOT EXISTS child_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nickname TEXT,
      birth_date TEXT NOT NULL,
      weight REAL,
      height REAL,
      gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول معلومات الوالدين
  db.run(`
    CREATE TABLE IF NOT EXISTS parent_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'father' or 'mother'
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      education_level TEXT,
      interests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول الذاكرة والمحادثات
  db.run(`
    CREATE TABLE IF NOT EXISTS memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_type TEXT NOT NULL,
      message_type TEXT NOT NULL, -- 'sent' or 'received'
      content TEXT NOT NULL,
      metadata TEXT, -- JSON data
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول القياسات الدورية
  db.run(`
    CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL,
      height REAL,
      notes TEXT,
      measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول الأنشطة والتوصيات
  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_type TEXT NOT NULL, -- 'exercise', 'game', 'outing', 'book', 'course'
      title TEXT NOT NULL,
      description TEXT,
      target TEXT, -- 'child', 'father', 'mother', 'both_parents'
      status TEXT DEFAULT 'suggested', -- 'suggested', 'completed', 'skipped'
      suggested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // جدول الجدولة
  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_type TEXT NOT NULL, -- 'morning', 'noon', 'evening', 'night'
      time TEXT NOT NULL, -- HH:MM format
      target TEXT NOT NULL, -- 'father', 'mother', 'both'
      message_template TEXT,
      enabled INTEGER DEFAULT 1,
      last_sent DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول ردود الفعل والتفاعل
  db.run(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_type TEXT NOT NULL,
      interaction_type TEXT NOT NULL, -- 'feedback', 'question', 'response'
      content TEXT NOT NULL,
      ai_response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // إدراج جداول افتراضية
  db.run(`
    INSERT OR IGNORE INTO schedules (schedule_type, time, target, message_template, enabled)
    VALUES
      ('morning', '07:00', 'both', 'weather_greeting', 1),
      ('morning', '09:00', 'mother', 'daily_tips', 1),
      ('noon', '12:00', 'father', 'midday_check', 1),
      ('evening', '18:00', 'both', 'evening_activities', 1),
      ('night', '21:00', 'both', 'bedtime_routine', 1)
  `);

  console.log('✅ قاعدة البيانات تم إنشائها بنجاح!');
});

db.close();

module.exports = db;
