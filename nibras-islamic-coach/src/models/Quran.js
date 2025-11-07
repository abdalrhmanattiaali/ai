const db = require('../config/database');
const moment = require('moment');

/**
 * نموذج القرآن - SQLite
 */
class Quran {
  /**
   * إنشاء سجل قراءة جديد
   */
  static create(data) {
    const database = db.getDB();

    // حساب النقاط
    const points = this._calculatePoints(data);

    const stmt = database.prepare(`
      INSERT INTO quran_readings (
        user_id, date, hijri_date,
        pages, from_surah, from_ayah, from_page, from_juz,
        to_surah, to_ayah, to_page, to_juz,
        duration, type, with_recitation, with_tafsir,
        points, notes
      ) VALUES (
        @user_id, @date, @hijri_date,
        @pages, @from_surah, @from_ayah, @from_page, @from_juz,
        @to_surah, @to_ayah, @to_page, @to_juz,
        @duration, @type, @with_recitation, @with_tafsir,
        @points, @notes
      )
    `);

    const params = {
      user_id: data.userId,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      hijri_date: data.hijriDate ? JSON.stringify(data.hijriDate) : null,

      pages: data.pages || 0,
      from_surah: data.from?.surah || null,
      from_ayah: data.from?.ayah || null,
      from_page: data.from?.page || null,
      from_juz: data.from?.juz || null,
      to_surah: data.to?.surah || null,
      to_ayah: data.to?.ayah || null,
      to_page: data.to?.page || null,
      to_juz: data.to?.juz || null,

      duration: data.duration || 0,
      type: data.type || 'ورد يومي',
      with_recitation: data.withRecitation ? 1 : 0,
      with_tafsir: data.withTafsir ? 1 : 0,

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
    const stmt = database.prepare('SELECT * FROM quran_readings WHERE id = ?');
    const row = stmt.get(id);

    return row ? this._formatQuran(row) : null;
  }

  /**
   * إحصائيات القرآن للمستخدم
   */
  static getUserQuranStats(userId, startDate, endDate) {
    const database = db.getDB();

    const stmt = database.prepare(`
      SELECT
        SUM(pages) as totalPages,
        COUNT(*) as totalSessions,
        SUM(duration) as totalDuration,
        SUM(points) as totalPoints,
        AVG(pages) as avgPages
      FROM quran_readings
      WHERE user_id = ? AND date BETWEEN ? AND ?
    `);

    const result = stmt.get(
      userId,
      new Date(startDate).toISOString(),
      new Date(endDate).toISOString()
    );

    return {
      totalPages: result.totalPages || 0,
      totalSessions: result.totalSessions || 0,
      totalDuration: result.totalDuration || 0,
      totalPoints: result.totalPoints || 0,
      avgPages: result.avgPages || 0
    };
  }

  /**
   * التقدم في الختمة الحالية
   */
  static getCurrentKhatmahProgress(userId) {
    const database = db.getDB();

    const stmt = database.prepare(`
      SELECT SUM(pages) as totalPages
      FROM quran_readings
      WHERE user_id = ? AND type = 'ختمة'
      ORDER BY date DESC
      LIMIT 604
    `);

    const result = stmt.get(userId);
    const totalPages = result?.totalPages || 0;

    return {
      pagesRead: totalPages % 604,
      percentage: ((totalPages % 604) / 604 * 100).toFixed(2),
      isComplete: totalPages >= 604
    };
  }

  /**
   * عدد الختمات
   */
  static getTotalKhatmahs(userId) {
    const database = db.getDB();

    const stmt = database.prepare(`
      SELECT SUM(pages) as totalPages
      FROM quran_readings
      WHERE user_id = ?
    `);

    const result = stmt.get(userId);
    const totalPages = result?.totalPages || 0;

    return Math.floor(totalPages / 604);
  }

  /**
   * حساب النقاط
   */
  static _calculatePoints(data) {
    let points = data.pages * 2; // 2 نقطة لكل صفحة

    if (data.type === 'حفظ') points *= 3;
    if (data.type === 'تدبر') points *= 1.5;
    if (data.withTafsir) points += 5;
    if (data.withRecitation) points += 3;

    // مكافأة القراءة الطويلة
    if (data.pages >= 20) points += 20; // جزء كامل
    if (data.pages >= 40) points += 50; // حزب كامل

    return Math.round(points);
  }

  /**
   * تنسيق القرآن من الصف
   */
  static _formatQuran(row) {
    return {
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      date: row.date,
      hijriDate: row.hijri_date ? JSON.parse(row.hijri_date) : null,

      pages: row.pages,
      from: {
        surah: row.from_surah,
        ayah: row.from_ayah,
        page: row.from_page,
        juz: row.from_juz,
      },
      to: {
        surah: row.to_surah,
        ayah: row.to_ayah,
        page: row.to_page,
        juz: row.to_juz,
      },

      duration: row.duration,
      type: row.type,
      withRecitation: row.with_recitation === 1,
      withTafsir: row.with_tafsir === 1,

      points: row.points,
      notes: row.notes,
      recordedAt: row.recorded_at,
    };
  }

  /**
   * عد القراءات
   */
  static count(filter = {}) {
    const database = db.getDB();

    let query = 'SELECT COUNT(*) as count FROM quran_readings WHERE 1=1';
    const params = [];

    if (filter.userId) {
      query += ' AND user_id = ?';
      params.push(filter.userId);
    }

    const stmt = database.prepare(query);
    const result = params.length > 0 ? stmt.get(...params) : stmt.get();

    return result.count;
  }

  /**
   * البحث عن قراءات المستخدم الأخيرة
   */
  static findRecent(userId, limit = 20) {
    const database = db.getDB();

    const stmt = database.prepare(`
      SELECT * FROM quran_readings
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT ?
    `);

    const rows = stmt.all(userId, limit);
    return rows.map(row => this._formatQuran(row));
  }
}

module.exports = Quran;
