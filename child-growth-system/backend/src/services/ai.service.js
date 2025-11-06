const OpenAI = require('openai');
const aiConfig = require('../config/ai.config');
const MemoryContext = require('../models/MemoryContext');
const Conversation = require('../models/Conversation');
const Child = require('../models/Child');
const Recommendation = require('../models/Recommendation');
const Activity = require('../models/Activity');

class AIService {
  constructor() {
    // تهيئة OpenAI
    if (aiConfig.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: aiConfig.openai.apiKey
      });
    }

    // TODO: تهيئة Anthropic Claude إذا لزم الأمر
  }

  /**
   * توليد محتوى مخصص
   */
  async generatePersonalizedContent(type, context) {
    try {
      // استرجاع سياق الذاكرة
      const memoryContext = await this.retrieveMemoryContext(context.familyId);

      // اختيار البرومبت المناسب
      const prompt = this.buildPrompt(type, { ...context, ...memoryContext });

      // اختيار النموذج
      const model = context.aiModel || aiConfig.openai.models.chat;

      // استدعاء AI
      const response = await this.callOpenAI(prompt, model, aiConfig.systemMessages[type] || aiConfig.systemMessages.default);

      // حفظ في الذاكرة
      await this.saveToMemory(context.familyId, `${type}_generated`, {
        prompt,
        response,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      console.error('❌ Error generating personalized content:', error);
      throw error;
    }
  }

  /**
   * معالجة محادثة
   */
  async processConversation(message, parentData) {
    try {
      const family = parentData.familyId;

      // جلب الأطفال
      const children = await Child.find({ familyId: family._id });

      // جلب آخر 10 رسائل
      const recentMessages = await this.getRecentMessages(parentData._id, 10);

      // استرجاع سياق الذاكرة
      const memoryContext = await this.retrieveMemoryContext(family._id);

      // بناء السياق
      const contextData = {
        parent: {
          name: parentData.name,
          role: parentData.role,
          preferences: parentData.preferences
        },
        children: children.map(child => ({
          name: child.nickname || child.fullName,
          age: child.age,
          interests: child.interests,
          development: child.development
        })),
        recentConversation: recentMessages,
        memory: memoryContext
      };

      // تحليل نية الرسالة
      const intent = await this.analyzeIntent(message);

      // بناء البرومبت
      const prompt = `
المحادثة السابقة:
${recentMessages.map(m => `${m.message.from === 'parent' ? 'الوالد' : 'رفيق النمو'}: ${m.message.content}`).join('\n')}

سياق الأسرة:
الوالد: ${contextData.parent.name} (${contextData.parent.role === 'father' ? 'أب' : 'أم'})
الأطفال: ${contextData.children.map(c => `${c.name} (${c.age?.years} سنوات)`).join('، ')}

الرسالة الحالية من الوالد:
"${message}"

الغرض المتوقع: ${intent.purpose}
المشاعر: ${intent.sentiment}

قدم رداً مفيداً، متعاطفاً، ومخصصاً لهذه الأسرة.
      `.trim();

      const response = await this.callOpenAI(
        prompt,
        aiConfig.openai.models.chat,
        aiConfig.systemMessages.conversational
      );

      return response;
    } catch (error) {
      console.error('❌ Error processing conversation:', error);
      return 'عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.';
    }
  }

  /**
   * تحليل نية الرسالة
   */
  async analyzeIntent(text) {
    try {
      const prompt = `
حلل الرسالة التالية واستخرج:
1. الغرض الرئيسي (purpose): سؤال، طلب نصيحة، مشاركة إنجاز، قلق، استفسار عام
2. المشاعر (sentiment): إيجابي، محايد، سلبي، قلق
3. الموضوع (topic): صحة، تعليم، سلوك، تغذية، نوم، تطور، عام
4. مستوى الإلحاح (urgency): منخفض، متوسط، عالي

الرسالة: "${text}"

أجب بصيغة JSON فقط:
{
  "purpose": "",
  "sentiment": "",
  "topic": "",
  "urgency": ""
}
      `.trim();

      const response = await this.callOpenAI(
        prompt,
        aiConfig.openai.models.chatFast,
        'أنت محلل للنصوص. قدم إجابات دقيقة بصيغة JSON فقط.'
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('❌ Error analyzing intent:', error);
      return {
        purpose: 'general',
        sentiment: 'neutral',
        topic: 'general',
        urgency: 'low'
      };
    }
  }

  /**
   * توليد توصية نشاط
   */
  async generateActivityRecommendation(childId) {
    try {
      const child = await Child.findById(childId).populate('familyId');

      if (!child) {
        throw new Error('Child not found');
      }

      // جلب الأنشطة الناجحة السابقة
      const successfulActivities = await Activity.find({
        childId: childId,
        'outcomes.completed': true,
        'outcomes.enjoymentRating': { $gte: 4 }
      })
        .sort({ date: -1 })
        .limit(5);

      // جلب التوصيات السابقة لتجنب التكرار
      const previousRecommendations = await Recommendation.find({
        childId: childId,
        type: 'activity'
      })
        .sort({ createdAt: -1 })
        .limit(10);

      const prompt = `
أنت خبير تربوي. أنشئ نشاط مبتكر وممتع للطفل التالي:

الاسم: ${child.nickname || child.fullName}
العمر: ${child.age?.years} سنوات و ${child.age?.months} شهور
الجنس: ${child.gender === 'male' ? 'ذكر' : 'أنثى'}
الاهتمامات: ${child.interests.join('، ')}
الأنشطة المفضلة: ${child.favoriteActivities.join('، ')}

مستوى التطور:
- حركي: ${child.development.motor}
- لغوي: ${child.development.language}
- اجتماعي: ${child.development.social}
- معرفي: ${child.development.cognitive}

الأنشطة التي أحبها سابقاً:
${successfulActivities.map(a => `- ${a.activityName}`).join('\n')}

تجنب هذه الأنشطة (تم اقتراحها مؤخراً):
${previousRecommendations.map(r => `- ${r.content.title}`).join('\n')}

أنشئ نشاط جديد ومبتكر بصيغة JSON:
{
  "title": "عنوان جذاب",
  "description": "وصف مفصل للنشاط",
  "duration": "المدة المتوقعة (مثل: 30 دقيقة)",
  "difficulty": "easy أو medium أو hard",
  "materials": ["مادة 1", "مادة 2"],
  "steps": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "benefits": ["فائدة 1", "فائدة 2"],
  "ageRange": "النطاق العمري المناسب",
  "category": "educational أو entertainment أو physical أو creative"
}
      `.trim();

      const response = await this.callOpenAI(
        prompt,
        aiConfig.openai.models.chat,
        aiConfig.systemMessages.recommendations
      );

      const activityData = JSON.parse(response);

      // حفظ التوصية
      const recommendation = await Recommendation.create({
        familyId: child.familyId._id,
        childId: child._id,
        type: 'activity',
        category: activityData.category,
        content: activityData,
        aiGenerated: true,
        generatedPrompt: prompt
      });

      return recommendation;
    } catch (error) {
      console.error('❌ Error generating activity recommendation:', error);
      throw error;
    }
  }

  /**
   * استدعاء OpenAI
   */
  async callOpenAI(prompt, model = 'gpt-4', systemMessage = null) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI is not configured. Please add OPENAI_API_KEY to .env');
      }

      const messages = [];

      if (systemMessage) {
        messages.push({
          role: 'system',
          content: systemMessage
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: aiConfig.openai.defaultSettings.temperature,
        max_tokens: aiConfig.openai.defaultSettings.maxTokens
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error);
      throw error;
    }
  }

  /**
   * بناء البرومبت
   */
  buildPrompt(type, context) {
    // يمكن تخصيص البرومبتات هنا حسب النوع
    return JSON.stringify(context);
  }

  /**
   * حفظ في الذاكرة
   */
  async saveToMemory(familyId, key, value, metadata = {}) {
    try {
      await MemoryContext.create({
        familyId: familyId,
        contextKey: key,
        contextType: metadata.type || 'history',
        data: value,
        metadata: {
          source: 'ai_generated',
          ...metadata
        }
      });
    } catch (error) {
      console.error('❌ Error saving to memory:', error);
    }
  }

  /**
   * استرجاع سياق الذاكرة
   */
  async retrieveMemoryContext(familyId, limit = 20) {
    try {
      const memories = await MemoryContext.find({
        familyId: familyId,
        isActive: true
      })
        .sort({ 'metadata.importance': -1, updatedAt: -1 })
        .limit(limit);

      return memories.reduce((acc, mem) => {
        acc[mem.contextKey] = mem.data;
        // تحديث عداد الوصول
        mem.recordAccess();
        return acc;
      }, {});
    } catch (error) {
      console.error('❌ Error retrieving memory context:', error);
      return {};
    }
  }

  /**
   * جلب آخر الرسائل
   */
  async getRecentMessages(parentId, limit = 10) {
    try {
      return await Conversation.find({ parentId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('❌ Error getting recent messages:', error);
      return [];
    }
  }
}

// Singleton instance
const aiService = new AIService();

module.exports = aiService;
