const db = require('../config/database');

/**
 * نموذج المحتوى - SQLite
 */
class Content {
  /**
   * إنشاء محتوى جديد
   */
  static create(data) {
    const database = db.getDB();

    const stmt = database.prepare(`
      INSERT INTO content (
        type, title, content, short_content,
        level, category, tags,
        schedule_enabled, schedule_time, schedule_frequency, schedule_days, schedule_occasions,
        source, reference, status
      ) VALUES (
        @type, @title, @content, @short_content,
        @level, @category, @tags,
        @schedule_enabled, @schedule_time, @schedule_frequency, @schedule_days, @schedule_occasions,
        @source, @reference, @status
      )
    `);

    const params = {
      type: data.type,
      title: data.title,
      content: data.content,
      short_content: data.shortContent || null,

      level: data.level || 'الكل',
      category: data.category || 'عبادات',
      tags: data.tags ? JSON.stringify(data.tags) : null,

      schedule_enabled: data.schedule?.enabled ? 1 : 0,
      schedule_time: data.schedule?.time || null,
      schedule_frequency: data.schedule?.frequency || null,
      schedule_days: data.schedule?.days ? JSON.stringify(data.schedule.days) : null,
      schedule_occasions: data.schedule?.occasions ? JSON.stringify(data.schedule.occasions) : null,

      source: data.source || null,
      reference: data.reference || null,
      status: data.status || 'نشط'
    };

    const result = stmt.run(params);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * البحث بالـ ID
   */
  static findById(id) {
    const database = db.getDB();
    const stmt = database.prepare('SELECT * FROM content WHERE id = ?');
    const row = stmt.get(id);

    return row ? this._formatContent(row) : null;
  }

  /**
   * الحصول على كل المحتوى
   */
  static findAll(filter = {}) {
    const database = db.getDB();

    let query = 'SELECT * FROM content WHERE status = ?';
    const params = [filter.status || 'نشط'];

    if (filter.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }

    if (filter.level) {
      query += ' AND (level = ? OR level = ?)';
      params.push(filter.level, 'الكل');
    }

    query += ' ORDER BY created_at DESC';

    const stmt = database.prepare(query);
    const rows = stmt.all(...params);

    return rows.map(row => this._formatContent(row));
  }

  /**
   * الحصول على محتوى مناسب
   */
  static getSuitableContent(type, level = 'الكل', occasion = null) {
    const database = db.getDB();

    let query = `
      SELECT * FROM content
      WHERE type = ?
        AND status = 'نشط'
        AND (level = ? OR level = 'الكل')
    `;
    const params = [type, level];

    if (occasion) {
      query += ` AND schedule_occasions LIKE ?`;
      params.push(`%${occasion}%`);
    }

    query += ` ORDER BY stats_sent ASC LIMIT 1`;

    const stmt = database.prepare(query);
    const row = stmt.get(...params);

    return row ? this._formatContent(row) : null;
  }

  /**
   * محتوى عشوائي
   */
  static getRandomContent(type, level = 'الكل') {
    const database = db.getDB();

    const countStmt = database.prepare(`
      SELECT COUNT(*) as count FROM content
      WHERE type = ? AND status = 'نشط'
        AND (level = ? OR level = 'الكل')
    `);

    const countResult = countStmt.get(type, level);
    if (countResult.count === 0) return null;

    const random = Math.floor(Math.random() * countResult.count);

    const stmt = database.prepare(`
      SELECT * FROM content
      WHERE type = ? AND status = 'نشط'
        AND (level = ? OR level = 'الكل')
      LIMIT 1 OFFSET ?
    `);

    const row = stmt.get(type, level, random);
    return row ? this._formatContent(row) : null;
  }

  /**
   * تسجيل إرسال
   */
  static recordSent(id) {
    const database = db.getDB();

    const stmt = database.prepare(`
      UPDATE content
      SET stats_sent = stats_sent + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * تحديث محتوى
   */
  static update(id, data) {
    const database = db.getDB();

    const fields = [];
    const params = {};

    if (data.title) {
      fields.push('title = @title');
      params.title = data.title;
    }
    if (data.content) {
      fields.push('content = @content');
      params.content = data.content;
    }
    if (data.status) {
      fields.push('status = @status');
      params.status = data.status;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.id = id;

    if (fields.length === 1) {
      return this.findById(id);
    }

    const query = `UPDATE content SET ${fields.join(', ')} WHERE id = @id`;
    const stmt = database.prepare(query);
    stmt.run(params);

    return this.findById(id);
  }

  /**
   * حذف محتوى
   */
  static delete(id) {
    const database = db.getDB();
    const stmt = database.prepare('DELETE FROM content WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * تنسيق المحتوى من الصف
   */
  static _formatContent(row) {
    return {
      _id: row.id,
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      shortContent: row.short_content,

      level: row.level,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],

      schedule: {
        enabled: row.schedule_enabled === 1,
        time: row.schedule_time,
        frequency: row.schedule_frequency,
        days: row.schedule_days ? JSON.parse(row.schedule_days) : [],
        occasions: row.schedule_occasions ? JSON.parse(row.schedule_occasions) : [],
      },

      source: row.source,
      reference: row.reference,

      stats: {
        sent: row.stats_sent,
        read: row.stats_read,
        liked: row.stats_liked,
      },

      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * عد المحتوى
   */
  static count(filter = {}) {
    const database = db.getDB();

    let query = 'SELECT COUNT(*) as count FROM content WHERE 1=1';
    const params = [];

    if (filter.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }

    if (filter.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }

    const stmt = database.prepare(query);
    const result = params.length > 0 ? stmt.get(...params) : stmt.get();

    return result.count;
  }
}

module.exports = Content;
