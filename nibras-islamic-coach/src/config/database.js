const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * إعداد قاعدة البيانات SQLite
 * ملف واحد فقط - بدون سيرفر MongoDB!
 */
class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'data', 'nibras.db');
  }

  /**
   * الاتصال بقاعدة البيانات
   */
  connect() {
    try {
      // إنشاء مجلد data إذا لم يكن موجوداً
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // فتح/إنشاء قاعدة البيانات
      this.db = new Database(this.dbPath);

      // تفعيل WAL mode للأداء الأفضل
      this.db.pragma('journal_mode = WAL');

      console.log('✅ متصل بقاعدة البيانات SQLite');
      console.log(`📊 الملف: ${this.dbPath}`);

      // إنشاء الجداول
      this.createTables();

      return this.db;

    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
      process.exit(1);
    }
  }

  /**
   * إنشاء الجداول
   */
  createTables() {
    // جدول المستخدمين
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',

        -- Profile
        profile_level TEXT DEFAULT 'متوسط',
        profile_goals TEXT,
        profile_weak_points TEXT,
        profile_learning_style TEXT DEFAULT 'رسائل قصيرة',

        -- Routine
        routine_wake_up TEXT DEFAULT '05:00',
        routine_sleep TEXT DEFAULT '23:00',
        routine_work_start TEXT DEFAULT '09:00',
        routine_work_end TEXT DEFAULT '17:00',
        routine_free_time TEXT,

        -- Location
        location_city TEXT DEFAULT 'Cairo',
        location_country TEXT DEFAULT 'Egypt',
        location_timezone TEXT DEFAULT 'Africa/Cairo',
        location_latitude REAL,
        location_longitude REAL,

        -- Stats
        stats_current_streak INTEGER DEFAULT 0,
        stats_longest_streak INTEGER DEFAULT 0,
        stats_total_points INTEGER DEFAULT 0,
        stats_level INTEGER DEFAULT 1,
        stats_last_prayer_date TEXT,
        stats_total_prayers INTEGER DEFAULT 0,
        stats_total_quran_pages INTEGER DEFAULT 0,

        -- Settings
        settings_reminders_before INTEGER DEFAULT 15,
        settings_reminders_after INTEGER DEFAULT 1,
        settings_daily_content INTEGER DEFAULT 1,
        settings_weekly_report INTEGER DEFAULT 1,
        settings_group_messages INTEGER DEFAULT 1,
        settings_language TEXT DEFAULT 'ar',

        -- Badges (JSON)
        badges TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول الصلوات
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS prayers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        prayer TEXT NOT NULL,
        date TEXT NOT NULL,
        hijri_date TEXT,
        status TEXT NOT NULL,

        in_masjid INTEGER DEFAULT 0,
        with_jamaa INTEGER DEFAULT 0,

        sunnah_before INTEGER DEFAULT 0,
        sunnah_after INTEGER DEFAULT 0,

        nafl_duha INTEGER DEFAULT 0,
        nafl_witr INTEGER DEFAULT 0,
        nafl_tahajjud INTEGER DEFAULT 0,
        nafl_qiyam INTEGER DEFAULT 0,

        points INTEGER DEFAULT 0,
        notes TEXT,

        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Index للصلوات
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_prayers_user_date ON prayers(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_prayers_user_prayer ON prayers(user_id, prayer);
    `);

    // جدول القرآن
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quran_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        hijri_date TEXT,

        pages INTEGER DEFAULT 0,
        from_surah TEXT,
        from_ayah INTEGER,
        from_page INTEGER,
        from_juz INTEGER,
        to_surah TEXT,
        to_ayah INTEGER,
        to_page INTEGER,
        to_juz INTEGER,

        duration INTEGER DEFAULT 0,
        type TEXT DEFAULT 'ورد يومي',
        with_recitation INTEGER DEFAULT 0,
        with_tafsir INTEGER DEFAULT 0,

        points INTEGER DEFAULT 0,
        notes TEXT,

        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Index للقرآن
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_quran_user_date ON quran_readings(user_id, date);
    `);

    // جدول المحتوى
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        short_content TEXT,

        level TEXT DEFAULT 'الكل',
        category TEXT DEFAULT 'عبادات',
        tags TEXT,

        schedule_enabled INTEGER DEFAULT 0,
        schedule_time TEXT,
        schedule_frequency TEXT,
        schedule_days TEXT,
        schedule_occasions TEXT,

        source TEXT,
        reference TEXT,

        stats_sent INTEGER DEFAULT 0,
        stats_read INTEGER DEFAULT 0,
        stats_liked INTEGER DEFAULT 0,

        status TEXT DEFAULT 'نشط',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index للمحتوى
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_content_type_level ON content(type, level);
      CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
    `);

    console.log('✅ تم إنشاء الجداول');
  }

  /**
   * الحصول على قاعدة البيانات
   */
  getDB() {
    if (!this.db) {
      this.connect();
    }
    return this.db;
  }

  /**
   * إغلاق الاتصال
   */
  disconnect() {
    try {
      if (this.db) {
        this.db.close();
        console.log('✅ تم إغلاق قاعدة البيانات');
      }
    } catch (error) {
      console.error('❌ خطأ في إغلاق قاعدة البيانات:', error);
    }
  }

  /**
   * تنظيف قاعدة البيانات
   */
  clearDatabase() {
    try {
      this.db.exec(`
        DELETE FROM prayers;
        DELETE FROM quran_readings;
        DELETE FROM content;
        DELETE FROM users;
      `);
      console.log('✅ تم تنظيف قاعدة البيانات');
    } catch (error) {
      console.error('❌ خطأ في تنظيف قاعدة البيانات:', error);
    }
  }

  /**
   * عمل Backup
   */
  backup() {
    try {
      const backupPath = path.join(
        process.cwd(),
        'backups',
        `nibras_backup_${Date.now()}.db`
      );

      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      this.db.backup(backupPath).then(() => {
        console.log(`✅ تم عمل Backup: ${backupPath}`);
      });

      return backupPath;
    } catch (error) {
      console.error('❌ خطأ في عمل Backup:', error);
    }
  }
}

module.exports = new SQLiteDatabase();
