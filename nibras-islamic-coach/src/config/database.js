const mongoose = require('mongoose');

/**
 * إعداد الاتصال بقاعدة البيانات MongoDB
 */
class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nibras_coach';

      mongoose.set('strictQuery', false);

      this.connection = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('✅ متصل بقاعدة البيانات MongoDB');
      console.log(`📊 قاعدة البيانات: ${this.connection.connection.name}`);

      // معالجة الأخطاء
      mongoose.connection.on('error', (error) => {
        console.error('❌ خطأ في قاعدة البيانات:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ انقطع الاتصال بقاعدة البيانات');
      });

      return this.connection;

    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
    } catch (error) {
      console.error('❌ خطأ في إغلاق الاتصال:', error);
    }
  }

  async clearDatabase() {
    try {
      const collections = mongoose.connection.collections;

      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }

      console.log('✅ تم تنظيف قاعدة البيانات');
    } catch (error) {
      console.error('❌ خطأ في تنظيف قاعدة البيانات:', error);
    }
  }
}

module.exports = new Database();
