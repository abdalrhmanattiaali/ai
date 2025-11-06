const whatsappService = require('../services/whatsapp.service');
const WhatsAppSession = require('../models/WhatsAppSession');
const MessageQueue = require('../models/MessageQueue');

// @desc    Initialize WhatsApp connection
// @route   POST /api/whatsapp/initialize
// @access  Private
exports.initialize = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if already connected
    const session = await WhatsAppSession.findOne({ userId });

    if (session && session.isConnected) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp متصل بالفعل'
      });
    }

    // Initialize WhatsApp
    await whatsappService.initialize(userId);

    res.status(200).json({
      success: true,
      message: 'جاري تهيئة WhatsApp، يرجى مسح رمز QR'
    });
  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء تهيئة WhatsApp'
    });
  }
};

// @desc    Get WhatsApp status
// @route   GET /api/whatsapp/status
// @access  Private
exports.getStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const session = await WhatsAppSession.findOne({ userId });

    if (!session) {
      return res.status(200).json({
        success: true,
        data: {
          isConnected: false,
          status: 'not_initialized'
        }
      });
    }

    const status = whatsappService.getConnectionStatus();

    res.status(200).json({
      success: true,
      data: {
        isConnected: status.isConnected,
        qrCode: status.qrCode,
        phoneNumber: session.phoneNumber,
        connectionStatus: session.connectionStatus,
        lastConnected: session.lastConnected,
        statistics: session.statistics
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect WhatsApp
// @route   POST /api/whatsapp/disconnect
// @access  Private
exports.disconnect = async (req, res, next) => {
  try {
    await whatsappService.disconnect();

    res.status(200).json({
      success: true,
      message: 'تم قطع اتصال WhatsApp بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups
// @route   GET /api/whatsapp/groups
// @access  Private
exports.getGroups = async (req, res, next) => {
  try {
    const groups = await whatsappService.getAllGroups();

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/whatsapp/send-message
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { phoneNumber, message, familyId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم الهاتف والرسالة'
      });
    }

    // Add to message queue
    const queuedMessage = await MessageQueue.create({
      recipientType: 'individual',
      recipientId: phoneNumber,
      message: {
        content: message,
        type: 'text'
      },
      priority: 'high',
      metadata: {
        familyId: familyId || null,
        source: 'manual'
      }
    });

    // Try to send immediately if connected
    if (whatsappService.isConnected) {
      try {
        const result = await whatsappService.sendMessage(phoneNumber, message);

        queuedMessage.status = 'sent';
        queuedMessage.sentAt = new Date();
        queuedMessage.metadata.messageId = result.messageId;
        await queuedMessage.save();

        return res.status(200).json({
          success: true,
          message: 'تم إرسال الرسالة بنجاح',
          data: result
        });
      } catch (sendError) {
        queuedMessage.errorLog.push({
          attempt: 1,
          error: sendError.message
        });
        queuedMessage.status = 'pending';
        await queuedMessage.save();

        return res.status(500).json({
          success: false,
          error: 'فشل الإرسال، تم إضافة الرسالة للطابور'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp غير متصل، تم إضافة الرسالة للطابور'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send message to group
// @route   POST /api/whatsapp/send-to-group
// @access  Private
exports.sendToGroup = async (req, res, next) => {
  try {
    const { groupId, message, familyId } = req.body;

    if (!groupId || !message) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال معرف المجموعة والرسالة'
      });
    }

    // Add to message queue
    const queuedMessage = await MessageQueue.create({
      recipientType: 'group',
      recipientId: groupId,
      message: {
        content: message,
        type: 'text'
      },
      priority: 'normal',
      metadata: {
        familyId: familyId || null,
        source: 'manual'
      }
    });

    // Try to send immediately if connected
    if (whatsappService.isConnected) {
      try {
        const result = await whatsappService.sendMessageToGroup(groupId, message);

        queuedMessage.status = 'sent';
        queuedMessage.sentAt = new Date();
        queuedMessage.metadata.messageId = result.messageId;
        await queuedMessage.save();

        return res.status(200).json({
          success: true,
          message: 'تم إرسال الرسالة للمجموعة بنجاح',
          data: result
        });
      } catch (sendError) {
        queuedMessage.status = 'pending';
        await queuedMessage.save();

        return res.status(500).json({
          success: false,
          error: 'فشل الإرسال، تم إضافة الرسالة للطابور'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp غير متصل، تم إضافة الرسالة للطابور'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Validate WhatsApp number
// @route   POST /api/whatsapp/validate-number
// @access  Private
exports.validateNumber = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم الهاتف'
      });
    }

    const isValid = await whatsappService.isValidWhatsAppNumber(phoneNumber);

    res.status(200).json({
      success: true,
      data: {
        phoneNumber,
        isValid,
        message: isValid ? 'الرقم صالح ومسجل على WhatsApp' : 'الرقم غير مسجل على WhatsApp'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get message queue status
// @route   GET /api/whatsapp/queue
// @access  Private
exports.getQueueStatus = async (req, res, next) => {
  try {
    const pending = await MessageQueue.countDocuments({ status: 'pending' });
    const processing = await MessageQueue.countDocuments({ status: 'processing' });
    const failed = await MessageQueue.countDocuments({ status: 'failed' });
    const sent = await MessageQueue.countDocuments({ status: 'sent' });

    const recentMessages = await MessageQueue.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-errorLog');

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          pending,
          processing,
          failed,
          sent,
          total: pending + processing + failed + sent
        },
        recentMessages
      }
    });
  } catch (error) {
    next(error);
  }
};
