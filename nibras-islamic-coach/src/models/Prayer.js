const db = require('../config/database');
const moment = require('moment');

/**
 * نموذج الصلاة - SQLite
 */
class Prayer {
  /**
   * إنشاء سجل صلاة جديد
   */
  static create(data) {
    const database = db.getDB();

    // حساب النقاط قبل الحفظ
    const points = this._calculatePoints(data);

    const stmt = database.prepare(`
      INSERT INTO prayers (
        user_id, prayer, date, hijri_date, status,
        in_masjid, with_jamaa,
        sunnah_before, sunnah_after,
        nafl_duha, nafl_witr, nafl_tahajjud, nafl_qiyam,
        points, notes
      ) VALUES (
        @user_id, @prayer, @date, @hijri_date, @status,
        @in_masjid, @with_jamaa,
        @sunnah_before, @sunnah_after,
        @nafl_duha, @nafl_witr, @nafl_tahajjud, @nafl_qiyam,
        @points, @notes
      )
    `);

    const params = {
      user_id: data.userId,
      prayer: data.prayer,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      hijri_date: data.hijriDate ? JSON.stringify(data.hijriDate) : null,
      status: data.status,

      in_masjid: data.inMasjid ? 1 : 0,
      with_jamaa: data.withJamaa ? 1 : 0,

      sunnah_before: data.sunnah?.before ? 1 : 0,
      sunnah_after: data.sunnah?.after ? 1 : 0,

      nafl_duha: data.nafl?.duha ? 1 : 0,
      nafl_witr: data.nafl?.witr ? 1 : 0,
      nafl_tahajjud: data.nafl?.tahajjud ? 1 : 0,
      nafl_qiyam: data.nafl?.qiyam ? 1 : 0,

      points: points,
      notes: data.notes || null
    };

    const result = stmt.run(params);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * البحث بالـ ID
   */
  static findById(id) {
    const database = db.getDB();
    const stmt = database.prepare('SELECT * FROM prayers WHERE id = ?');
    const row = stmt.get(id);

    return row ? this._formatPrayer(row) : null;
  }

  /**
   * إحصائيات المستخدم لفترة معينة
   */
  static getUserStats(userId, startDate, endDate) {
    const database = db.getDB();

    const stmt = database.prepare(`
      SELECT
        prayer,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'في الوقت' THEN 1 ELSE 0 END) as onTime,
        SUM(CASE WHEN status = 'فائت' THEN 1 ELSE 0 END) as missed,
        SUM(points) as totalPoints
      FROM prayers
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY prayer
    `);

    const rows = stmt.all(
      userId,
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    );

    return rows.map(row => ({
      _id: row.prayer,
      total: row.total,
      onTime: row.onTime,
      missed: row.missed,
      totalPoints: row.totalPoints
    }));
  }

  /**
   * الصلوات اليوم
   */
  static getTodayPrayers(userId) {
    const database = db.getDB();

    const today = moment().startOf('day').toISOString();
    const tomorrow = moment().add(1, 'day').startOf('day').toISOString();

    const stmt = database.prepare(`
      SELECT * FROM prayers
      WHERE user_id = ? AND date >= ? AND date < ?
      ORDER BY date ASC
    `);

    const rows = stmt.all(userId, today, tomorrow);
    return rows.map(row => this._formatPrayer(row));
  }

  /**
   * حساب النقاط
   */
  static _calculatePoints(data) {
    let points = 0;

    // النقاط الأساسية
    switch(data.status) {
      case 'في الوقت':
        points = 10;
        break;
      case 'متأخر':
        points = 7;
        break;
      case 'قضاء':
        points = 5;
        break;
      case 'فائت':
        points = -15;
        break;
    }

    // نقاط إضافية
    if (data.inMasjid) points += 10;
    if (data.withJamaa) points += 5;
    if (data.sunnah?.before) points += 3;
    if (data.sunnah?.after) points += 3;

    // نقاط النوافل
    if (data.nafl?.duha) points += 8;
    if (data.nafl?.witr) points += 10;
    if (data.nafl?.tahajjud) points += 50;
    if (data.nafl?.qiyam) points += 25;

    return points;
  }

  /**
   * تنسيق الصلاة من الصف
   */
  static _formatPrayer(row) {
    return {
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      prayer: row.prayer,
      date: row.date,
      hijriDate: row.hijri_date ? JSON.parse(row.hijri_date) : null,
      status: row.status,

      inMasjid: row.in_masjid === 1,
      withJamaa: row.with_jamaa === 1,

      sunnah: {
        before: row.sunnah_before === 1,
        after: row.sunnah_after === 1,
      },

      nafl: {
        duha: row.nafl_duha === 1,
        witr: row.nafl_witr === 1,
        tahajjud: row.nafl_tahajjud === 1,
        qiyam: row.nafl_qiyam === 1,
      },

      points: row.points,
      notes: row.notes,
      recordedAt: row.recorded_at,
    };
  }

  /**
   * عد الصلوات
   */
  static count(filter = {}) {
    const database = db.getDB();

    let query = 'SELECT COUNT(*) as count FROM prayers WHERE 1=1';
    const params = [];

    if (filter.userId) {
      query += ' AND user_id = ?';
      params.push(filter.userId);
    }

    if (filter.date) {
      query += ' AND date = ?';
      params.push(filter.date);
    }

    const stmt = database.prepare(query);
    const result = params.length > 0 ? stmt.get(...params) : stmt.get();

    return result.count;
  }
}

module.exports = Prayer;
