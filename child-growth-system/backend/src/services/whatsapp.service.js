const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const whatsappConfig = require('../config/whatsapp.config');
const WhatsAppSession = require('../models/WhatsAppSession');
const Conversation = require('../models/Conversation');
const Parent = require('../models/Parent');
const MessageQueue = require('../models/MessageQueue');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.qrCode = null;
    this.sessionData = null;
    this.eventEmitter = null; // سنستخدمه مع Socket.io
  }

  // تعيين Event Emitter (Socket.io)
  setEventEmitter(emitter) {
    this.eventEmitter = emitter;
  }

  // تهيئة العميل
  async initialize(userId) {
    try {
      console.log('🔄 Initializing WhatsApp client...');

      // البحث أو إنشاء Session في قاعدة البيانات
      let session = await WhatsAppSession.findOne({ userId });
      if (!session) {
        session = await WhatsAppSession.create({
          userId,
          sessionName: 'main-session'
        });
      }

      this.sessionData = session;

      // إنشاء WhatsApp Client
      this.client = new Client(whatsappConfig);

      // معالجة QR Code
      this.client.on('qr', async (qr) => {
        console.log('📱 QR Code received');
        this.qrCode = qr;

        // تحويل QR إلى base64
        const qrImage = await qrcode.toDataURL(qr);

        // حفظ في قاعدة البيانات
        await session.updateConnectionStatus('qr', { qrCode: qrImage });

        // إرسال عبر Socket.io
        if (this.eventEmitter) {
          this.eventEmitter.emit('whatsapp:qr', { qrCode: qrImage });
        }
      });

      // عند الاتصال الناجح
      this.client.on('ready', async () => {
        console.log('✅ WhatsApp client is ready!');
        this.isConnected = true;

        const clientInfo = {
          platform: this.client.info.platform,
          pushname: this.client.info.pushname,
          me: this.client.info.wid._serialized,
          waVersion: this.client.info.phone.wa_version
        };

        const phoneNumber = this.client.info.wid.user;

        await session.updateConnectionStatus('connected', {
          clientInfo,
          phoneNumber: `+${phoneNumber}`
        });

        if (this.eventEmitter) {
          this.eventEmitter.emit('whatsapp:connected', {
            status: 'connected',
            phoneNumber: `+${phoneNumber}`,
            clientInfo
          });
        }

        // بدء معالجة طابور الرسائل
        this.startQueueProcessor();
      });

      // عند الاتصال
      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp authenticated');
      });

      // عند فشل المصادقة
      this.client.on('auth_failure', async (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        await session.addError('Authentication failed', msg);
        await session.updateConnectionStatus('error');

        if (this.eventEmitter) {
          this.eventEmitter.emit('whatsapp:error', { error: 'Authentication failed' });
        }
      });

      // عند قطع الاتصال
      this.client.on('disconnected', async (reason) => {
        console.log('⚠️  WhatsApp disconnected:', reason);
        this.isConnected = false;

        await session.updateConnectionStatus('disconnected', { reason });

        if (this.eventEmitter) {
          this.eventEmitter.emit('whatsapp:disconnected', { reason });
        }
      });

      // استقبال الرسائل
      this.client.on('message', async (message) => {
        await this.handleIncomingMessage(message);
      });

      // تحديثات حالة الرسالة
      this.client.on('message_ack', async (message, ack) => {
        await this.handleMessageStatus(message, ack);
      });

      // بدء التهيئة
      await this.client.initialize();

      return { success: true, message: 'WhatsApp client initialized' };
    } catch (error) {
      console.error('❌ Error initializing WhatsApp:', error);
      if (this.sessionData) {
        await this.sessionData.addError(error.message, error.stack);
      }
      throw error;
    }
  }

  // إرسال رسالة نصية
  async sendMessage(phoneNumber, text) {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp client is not connected');
    }

    try {
      const chatId = this.formatPhoneNumber(phoneNumber);
      const message = await this.client.sendMessage(chatId, text);

      // تحديث الإحصائيات
      if (this.sessionData) {
        this.sessionData.statistics.totalMessagesSent++;
        await this.sessionData.save();
      }

      console.log(`✅ Message sent to ${phoneNumber}`);

      return {
        success: true,
        messageId: message.id._serialized,
        timestamp: message.timestamp
      };
    } catch (error) {
      console.error(`❌ Error sending message to ${phoneNumber}:`, error);
      throw error;
    }
  }

  // إرسال رسالة مع صورة
  async sendMessageWithImage(phoneNumber, text, imageUrl) {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp client is not connected');
    }

    try {
      const chatId = this.formatPhoneNumber(phoneNumber);
      const media = await MessageMedia.fromUrl(imageUrl);
      const message = await this.client.sendMessage(chatId, media, { caption: text });

      if (this.sessionData) {
        this.sessionData.statistics.totalMessagesSent++;
        await this.sessionData.save();
      }

      return {
        success: true,
        messageId: message.id._serialized
      };
    } catch (error) {
      console.error('❌ Error sending image message:', error);
      throw error;
    }
  }

  // إرسال رسالة لمجموعة
  async sendMessageToGroup(groupId, text) {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp client is not connected');
    }

    try {
      const message = await this.client.sendMessage(groupId, text);

      if (this.sessionData) {
        this.sessionData.statistics.totalMessagesSent++;
        await this.sessionData.save();
      }

      return {
        success: true,
        messageId: message.id._serialized
      };
    } catch (error) {
      console.error('❌ Error sending group message:', error);
      throw error;
    }
  }

  // الحصول على كل المجموعات
  async getAllGroups() {
    if (!this.isConnected || !this.client) {
      throw new Error('WhatsApp client is not connected');
    }

    try {
      const chats = await this.client.getChats();
      const groups = chats.filter(chat => chat.isGroup);

      return groups.map(group => ({
        id: group.id._serialized,
        name: group.name,
        participants: group.participants ? group.participants.length : 0,
        unreadCount: group.unreadCount
      }));
    } catch (error) {
      console.error('❌ Error getting groups:', error);
      throw error;
    }
  }

  // التحقق من صحة رقم الواتساب
  async isValidWhatsAppNumber(phoneNumber) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const chatId = this.formatPhoneNumber(phoneNumber);
      const isRegistered = await this.client.isRegisteredUser(chatId);
      return isRegistered;
    } catch (error) {
      console.error('❌ Error validating number:', error);
      return false;
    }
  }

  // تنسيق رقم الهاتف
  formatPhoneNumber(phoneNumber) {
    // إزالة أي رموز خاصة
    let cleaned = phoneNumber.replace(/[^\d]/g, '');

    // إضافة كود الدولة إذا لم يكن موجود (افتراض مصر +20)
    if (!cleaned.startsWith('20') && cleaned.length === 10) {
      cleaned = '20' + cleaned;
    }

    return cleaned + '@c.us';
  }

  // معالجة الرسائل الواردة
  async handleIncomingMessage(message) {
    try {
      const from = message.from;
      const body = message.body;
      const isGroup = from.includes('@g.us');

      if (isGroup) {
        return; // تجاهل رسائل المجموعات للآن
      }

      console.log(`📨 Received message from ${from}: ${body}`);

      // البحث عن الوالد المرتبط برقم الواتساب
      const fromNumber = '+' + from.replace('@c.us', '');
      const parent = await Parent.findOne({ whatsappNumber: fromNumber }).populate('familyId');

      if (!parent) {
        console.log(`ℹ️  No parent found for ${fromNumber}`);
        return;
      }

      // حفظ الرسالة في قاعدة البيانات
      await Conversation.create({
        familyId: parent.familyId._id,
        parentId: parent._id,
        message: {
          from: 'parent',
          content: body,
          type: message.type || 'text'
        },
        timestamp: new Date(),
        metadata: {
          messageId: message.id._serialized,
          delivered: true
        }
      });

      // تحديث إحصائيات الوالد
      await parent.updateLastInteraction();

      // تحديث إحصائيات Session
      if (this.sessionData) {
        this.sessionData.statistics.totalMessagesReceived++;
        await this.sessionData.save();
      }

      // TODO: معالجة الرسالة بالذكاء الاصطناعي وإرسال رد
      // سنضيف هذا لاحقاً

    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  }

  // معالجة حالة الرسالة
  async handleMessageStatus(message, ack) {
    const statusMap = {
      0: 'error',
      1: 'pending',
      2: 'sent',
      3: 'delivered',
      4: 'read'
    };

    const status = statusMap[ack] || 'unknown';

    try {
      await MessageQueue.updateOne(
        { 'metadata.messageId': message.id._serialized },
        {
          status: status,
          [`${status}At`]: new Date()
        }
      );
    } catch (error) {
      console.error('❌ Error updating message status:', error);
    }
  }

  // معالج طابور الرسائل
  async startQueueProcessor() {
    console.log('🔄 Starting message queue processor...');

    setInterval(async () => {
      if (!this.isConnected) return;

      try {
        // جلب الرسائل المعلقة
        const messages = await MessageQueue.find({
          status: 'pending',
          scheduledFor: { $lte: new Date() },
          attempts: { $lt: 3 }
        })
          .sort({ priority: -1, scheduledFor: 1 })
          .limit(10);

        for (const msg of messages) {
          try {
            // تحديث الحالة إلى processing
            msg.status = 'processing';
            msg.attempts++;
            await msg.save();

            // إرسال الرسالة
            let result;
            if (msg.recipientType === 'individual') {
              result = await this.sendMessage(msg.recipientId, msg.message.content);
            } else {
              result = await this.sendMessageToGroup(msg.recipientId, msg.message.content);
            }

            // تحديث الحالة إلى sent
            msg.status = 'sent';
            msg.sentAt = new Date();
            msg.metadata.messageId = result.messageId;
            await msg.save();

          } catch (error) {
            msg.errorLog.push({
              attempt: msg.attempts,
              error: error.message
            });

            if (msg.attempts >= msg.maxAttempts) {
              msg.status = 'failed';
            } else {
              msg.status = 'pending';
            }

            await msg.save();
          }
        }
      } catch (error) {
        console.error('❌ Error in queue processor:', error);
      }
    }, 5000); // كل 5 ثواني
  }

  // قطع الاتصال
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
      console.log('🔌 WhatsApp client disconnected');

      if (this.sessionData) {
        await this.sessionData.updateConnectionStatus('disconnected', {
          reason: 'Manual disconnect'
        });
      }
    }
  }

  // الحصول على حالة الاتصال
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      qrCode: this.qrCode,
      sessionData: this.sessionData
    };
  }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
