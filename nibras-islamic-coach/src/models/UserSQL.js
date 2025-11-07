const db = require('../config/database');

/**
 * نموذج المستخدم - SQLite
 */
class User {
  /**
   * إنشاء مستخدم جديد
   */
  static create(data) {
    const database = db.getDB();

    const stmt = database.prepare(`
      INSERT INTO users (
        name, phone, status,
        profile_level, profile_goals, profile_weak_points, profile_learning_style,
        routine_wake_up, routine_sleep, routine_work_start, routine_work_end, routine_free_time,
        location_city, location_country, location_timezone, location_latitude, location_longitude,
        settings_reminders_before, settings_daily_content, settings_weekly_report
      ) VALUES (
        @name, @phone, @status,
        @profile_level, @profile_goals, @profile_weak_points, @profile_learning_style,
        @routine_wake_up, @routine_sleep, @routine_work_start, @routine_work_end, @routine_free_time,
        @location_city, @location_country, @location_timezone, @location_latitude, @location_longitude,
        @settings_reminders_before, @settings_daily_content, @settings_weekly_report
      )
    `);

    const params = {
      name: data.name,
      phone: data.phone,
      status: data.status || 'active',

      profile_level: data.profile?.level || 'متوسط',
      profile_goals: JSON.stringify(data.profile?.goals || []),
      profile_weak_points: JSON.stringify(data.profile?.weakPoints || []),
      profile_learning_style: data.profile?.preferredLearningStyle || 'رسائل قصيرة',

      routine_wake_up: data.routine?.wakeUpTime || '05:00',
      routine_sleep: data.routine?.sleepTime || '23:00',
      routine_work_start: data.routine?.workHours?.start || '09:00',
      routine_work_end: data.routine?.workHours?.end || '17:00',
      routine_free_time: JSON.stringify(data.routine?.freeTime || []),

      location_city: data.location?.city || 'Cairo',
      location_country: data.location?.country || 'Egypt',
      location_timezone: data.location?.timezone || 'Africa/Cairo',
      location_latitude: data.location?.latitude || null,
      location_longitude: data.location?.longitude || null,

      settings_reminders_before: data.settings?.remindersBefore || 15,
      settings_daily_content: data.settings?.dailyContent !== false ? 1 : 0,
      settings_weekly_report: data.settings?.weeklyReport !== false ? 1 : 0,
    };

    const result = stmt.run(params);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * البحث بالـ ID
   */
  static findById(id) {
    const database = db.getDB();
    const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);

    return row ? this._formatUser(row) : null;
  }

  /**
   * البحث بالهاتف
   */
  static findByPhone(phone) {
    const database = db.getDB();
    const stmt = database.prepare('SELECT * FROM users WHERE phone LIKE ?');
    const row = stmt.get(`%${phone}%`);

    return row ? this._formatUser(row) : null;
  }

  /**
   * الحصول على كل المستخدمين
   */
  static findAll(filter = {}) {
    const database = db.getDB();

    let query = 'SELECT * FROM users';
    const params = [];

    if (filter.status) {
      query += ' WHERE status = ?';
      params.push(filter.status);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = database.prepare(query);
    const rows = params.length > 0 ? stmt.all(...params) : stmt.all();

    return rows.map(row => this._formatUser(row));
  }

  /**
   * تحديث مستخدم
   */
  static update(id, data) {
    const database = db.getDB();

    const fields = [];
    const params = {};

    if (data.name) {
      fields.push('name = @name');
      params.name = data.name;
    }
    if (data.status) {
      fields.push('status = @status');
      params.status = data.status;
    }
    if (data.profile?.level) {
      fields.push('profile_level = @profile_level');
      params.profile_level = data.profile.level;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.id = id;

    if (fields.length === 1) {
      return this.findById(id);
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = @id`;
    const stmt = database.prepare(query);
    stmt.run(params);

    return this.findById(id);
  }

  /**
   * حذف مستخدم
   */
  static delete(id) {
    const database = db.getDB();
    const stmt = database.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * إضافة نقاط
   */
  static addPoints(id, points) {
    const database = db.getDB();
    const stmt = database.prepare(`
      UPDATE users
      SET stats_total_points = stats_total_points + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(points, id);

    this.updateLevel(id);
    return this.findById(id);
  }

  /**
   * تحديث المستوى
   */
  static updateLevel(id) {
    const user = this.findById(id);
    if (!user) return;

    const points = user.stats.totalPoints;
    let level = 1;

    if (points >= 5000) level = 5;
    else if (points >= 2000) level = 4;
    else if (points >= 1000) level = 3;
    else if (points >= 500) level = 2;

    const database = db.getDB();
    const stmt = database.prepare('UPDATE users SET stats_level = ? WHERE id = ?');
    stmt.run(level, id);
  }

  /**
   * تحديث الشريط (Streak)
   */
  static updateStreak(id, date) {
    const user = this.findById(id);
    if (!user) return;

    const database = db.getDB();
    const today = new Date(date);
    const lastPrayer = user.stats.lastPrayerDate ? new Date(user.stats.lastPrayerDate) : null;

    let currentStreak = user.stats.currentStreak;

    if (!lastPrayer) {
      currentStreak = 1;
    } else {
      const diffDays = Math.floor((today - lastPrayer) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    const longestStreak = Math.max(currentStreak, user.stats.longestStreak);

    const stmt = database.prepare(`
      UPDATE users
      SET stats_current_streak = ?,
          stats_longest_streak = ?,
          stats_last_prayer_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(currentStreak, longestStreak, today.toISOString(), id);
    return this.findById(id);
  }

  /**
   * إضافة وسام
   */
  static addBadge(id, badge) {
    const user = this.findById(id);
    if (!user) return;

    const badges = user.badges || [];
    const exists = badges.find(b => b.name === badge.name);
    if (exists) return user;

    badges.push({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      earnedAt: new Date().toISOString()
    });

    const database = db.getDB();
    const stmt = database.prepare('UPDATE users SET badges = ? WHERE id = ?');
    stmt.run(JSON.stringify(badges), id);

    return this.findById(id);
  }

  /**
   * تنسيق المستخدم من الصف
   */
  static _formatUser(row) {
    return {
      _id: row.id,
      id: row.id,
      name: row.name,
      phone: row.phone,
      status: row.status,

      profile: {
        level: row.profile_level,
        goals: this._parseJSON(row.profile_goals),
        weakPoints: this._parseJSON(row.profile_weak_points),
        preferredLearningStyle: row.profile_learning_style,
      },

      routine: {
        wakeUpTime: row.routine_wake_up,
        sleepTime: row.routine_sleep,
        workHours: {
          start: row.routine_work_start,
          end: row.routine_work_end,
        },
        freeTime: this._parseJSON(row.routine_free_time),
      },

      location: {
        city: row.location_city,
        country: row.location_country,
        timezone: row.location_timezone,
        latitude: row.location_latitude,
        longitude: row.location_longitude,
      },

      stats: {
        currentStreak: row.stats_current_streak,
        longestStreak: row.stats_longest_streak,
        totalPoints: row.stats_total_points,
        level: row.stats_level,
        lastPrayerDate: row.stats_last_prayer_date,
        totalPrayers: row.stats_total_prayers,
        totalQuranPages: row.stats_total_quran_pages,
      },

      settings: {
        remindersBefore: row.settings_reminders_before,
        remindersAfter: row.settings_reminders_after === 1,
        dailyContent: row.settings_daily_content === 1,
        weeklyReport: row.settings_weekly_report === 1,
        groupMessages: row.settings_group_messages === 1,
        language: row.settings_language,
      },

      badges: this._parseJSON(row.badges),

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Parse JSON بأمان
   */
  static _parseJSON(str) {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }

  /**
   * عد المستخدمين
   */
  static count(filter = {}) {
    const database = db.getDB();

    let query = 'SELECT COUNT(*) as count FROM users';
    const params = [];

    if (filter.status) {
      query += ' WHERE status = ?';
      params.push(filter.status);
    }

    const stmt = database.prepare(query);
    const result = params.length > 0 ? stmt.get(...params) : stmt.get();

    return result.count;
  }
}

module.exports = User;
