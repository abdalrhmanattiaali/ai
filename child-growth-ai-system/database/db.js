const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'child-growth.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err);
      } else {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
      }
    });
  }

  // Helper function to promisify database queries
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Child Info Methods
  async saveChildInfo(childData) {
    const { name, nickname, birth_date, weight, height, gender } = childData;

    // Check if child exists
    const existing = await this.get('SELECT id FROM child_info LIMIT 1');

    if (existing) {
      return this.run(
        `UPDATE child_info SET name=?, nickname=?, birth_date=?, weight=?, height=?, gender=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [name, nickname, birth_date, weight, height, gender, existing.id]
      );
    } else {
      return this.run(
        `INSERT INTO child_info (name, nickname, birth_date, weight, height, gender) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, nickname, birth_date, weight, height, gender]
      );
    }
  }

  async getChildInfo() {
    return this.get('SELECT * FROM child_info LIMIT 1');
  }

  // Parent Info Methods
  async saveParentInfo(parentData) {
    const { type, name, phone, education_level, interests } = parentData;

    const existing = await this.get('SELECT id FROM parent_info WHERE type=?', [type]);

    if (existing) {
      return this.run(
        `UPDATE parent_info SET name=?, phone=?, education_level=?, interests=?, updated_at=CURRENT_TIMESTAMP WHERE type=?`,
        [name, phone, education_level, interests, type]
      );
    } else {
      return this.run(
        `INSERT INTO parent_info (type, name, phone, education_level, interests) VALUES (?, ?, ?, ?, ?)`,
        [type, name, phone, education_level, interests]
      );
    }
  }

  async getParentInfo(type) {
    return this.get('SELECT * FROM parent_info WHERE type=?', [type]);
  }

  async getAllParents() {
    return this.query('SELECT * FROM parent_info');
  }

  // Memory Methods
  async addMemory(parentType, messageType, content, metadata = null) {
    return this.run(
      `INSERT INTO memory (parent_type, message_type, content, metadata) VALUES (?, ?, ?, ?)`,
      [parentType, messageType, content, JSON.stringify(metadata)]
    );
  }

  async getRecentMemory(parentType, limit = 10) {
    return this.query(
      `SELECT * FROM memory WHERE parent_type=? ORDER BY timestamp DESC LIMIT ?`,
      [parentType, limit]
    );
  }

  async getAllMemory(limit = 50) {
    return this.query(
      `SELECT * FROM memory ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  // Measurements Methods
  async addMeasurement(weight, height, notes = null) {
    return this.run(
      `INSERT INTO measurements (weight, height, notes) VALUES (?, ?, ?)`,
      [weight, height, notes]
    );
  }

  async getMeasurements(limit = 10) {
    return this.query(
      `SELECT * FROM measurements ORDER BY measured_at DESC LIMIT ?`,
      [limit]
    );
  }

  // Activities Methods
  async addActivity(activityType, title, description, target) {
    return this.run(
      `INSERT INTO activities (activity_type, title, description, target) VALUES (?, ?, ?, ?)`,
      [activityType, title, description, target]
    );
  }

  async getActivities(status = null, limit = 20) {
    if (status) {
      return this.query(
        `SELECT * FROM activities WHERE status=? ORDER BY suggested_at DESC LIMIT ?`,
        [status, limit]
      );
    }
    return this.query(
      `SELECT * FROM activities ORDER BY suggested_at DESC LIMIT ?`,
      [limit]
    );
  }

  async updateActivityStatus(id, status) {
    return this.run(
      `UPDATE activities SET status=?, completed_at=CURRENT_TIMESTAMP WHERE id=?`,
      [status, id]
    );
  }

  // Schedule Methods
  async getSchedules(enabled = null) {
    if (enabled !== null) {
      return this.query('SELECT * FROM schedules WHERE enabled=?', [enabled ? 1 : 0]);
    }
    return this.query('SELECT * FROM schedules');
  }

  async updateSchedule(id, data) {
    const { time, enabled, message_template } = data;
    return this.run(
      `UPDATE schedules SET time=?, enabled=?, message_template=? WHERE id=?`,
      [time, enabled ? 1 : 0, message_template, id]
    );
  }

  async updateScheduleLastSent(id) {
    return this.run(
      `UPDATE schedules SET last_sent=CURRENT_TIMESTAMP WHERE id=?`,
      [id]
    );
  }

  // Interactions Methods
  async addInteraction(parentType, interactionType, content, aiResponse = null) {
    return this.run(
      `INSERT INTO interactions (parent_type, interaction_type, content, ai_response) VALUES (?, ?, ?, ?)`,
      [parentType, interactionType, content, aiResponse]
    );
  }

  async getInteractions(parentType = null, limit = 20) {
    if (parentType) {
      return this.query(
        `SELECT * FROM interactions WHERE parent_type=? ORDER BY timestamp DESC LIMIT ?`,
        [parentType, limit]
      );
    }
    return this.query(
      `SELECT * FROM interactions ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();
