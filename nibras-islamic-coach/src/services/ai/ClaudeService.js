const Anthropic = require('@anthropic-ai/sdk');

/**
 * خدمة Claude AI للتحليل الذكي والنصائح الشخصية
 * تستخدم لـ:
 * - تحليل أنماط السلوك والعبادات
 * - تقديم نصائح مخصصة
 * - كشف نقاط القوة والضعف
 * - توليد رسائل تحفيزية
 */
class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = 'claude-sonnet-4-5-20250929'; // أحدث موديل
  }

  /**
   * تحليل شامل لسلوك المستخدم وأنماط عباداته
   */
  async analyzeUserBehavior(user, prayerHistory, quranHistory) {
    try {
      const prompt = this._buildAnalysisPrompt(user, prayerHistory, quranHistory);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const analysis = JSON.parse(response.content[0].text);
      return analysis;

    } catch (error) {
      console.error('Claude Analysis Error:', error);
      throw error;
    }
  }

  /**
   * توليد نصائح شخصية بناءً على التحليل
   */
  async generatePersonalizedAdvice(user, analysis) {
    try {
      const prompt = `
أنت مدرب ديني ذكي ومتخصص في مساعدة المسلمين على تحسين التزامهم بالعبادات.

معلومات المستخدم:
- الاسم: ${user.name}
- المستوى: ${user.profile.level}
- الأهداف: ${user.profile.goals.join(', ')}
- نقاط الضعف المعروفة: ${user.profile.weakPoints.join(', ')}

التحليل الحالي:
${JSON.stringify(analysis, null, 2)}

المطلوب:
قدم 3-5 نصائح عملية ومحددة لمساعدة المستخدم على تحسين التزامه.
كل نصيحة يجب أن تتضمن:
1. المشكلة المحددة
2. الحل العملي (خطوات واضحة)
3. الدافع الشرعي أو الأجر المنتظر
4. مدة التطبيق المقترحة

أرجع النتيجة بصيغة JSON:
{
  "advice": [
    {
      "problem": "المشكلة",
      "solution": "الحل العملي",
      "motivation": "الدافع الشرعي",
      "duration": "المدة المقترحة",
      "priority": "high/medium/low"
    }
  ]
}
`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].text);

    } catch (error) {
      console.error('Claude Advice Error:', error);
      throw error;
    }
  }

  /**
   * توليد رسالة تحفيزية مخصصة
   */
  async generateMotivationalMessage(user, context = {}) {
    try {
      const { event, achievement, streak } = context;

      const prompt = `
أنت مدرب ديني محفز. قم بإنشاء رسالة تحفيزية قصيرة (2-4 أسطر) للمستخدم.

المستخدم: ${user.name}
المستوى: ${user.profile.level}
الشريط الحالي: ${user.stats.currentStreak} يوم
النقاط: ${user.stats.totalPoints}

السياق:
${event ? `- حدث: ${event}` : ''}
${achievement ? `- إنجاز: ${achievement}` : ''}
${streak ? `- شريط جديد: ${streak} يوم` : ''}

قدم رسالة:
- محفزة وإيجابية
- تتضمن آية أو حديث مناسب (اختياري)
- عملية وليست نظرية
- تناسب المستوى الديني للمستخدم

أرجع النتيجة كنص مباشر (ليس JSON).
`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text.trim();

    } catch (error) {
      console.error('Claude Motivation Error:', error);
      throw error;
    }
  }

  /**
   * اقتراح روتين يومي مخصص
   */
  async suggestDailyRoutine(user, preferences = {}) {
    try {
      const prompt = `
أنت مستشار ديني متخصص في بناء الروتينات اليومية المتوازنة.

معلومات المستخدم:
- وقت الاستيقاظ: ${user.routine.wakeUpTime}
- وقت النوم: ${user.routine.sleepTime}
- ساعات العمل: ${user.routine.workHours.start} - ${user.routine.workHours.end}
- المستوى: ${user.profile.level}
- الأهداف: ${user.profile.goals.join(', ')}

صمم روتين يومي مخصص يتضمن:
- الصلوات الخمس مع السنن
- ورد قرآني مناسب
- أذكار الصباح والمساء
- وقت للتعلم الديني
- دعاء أو ذكر في أوقات متفرقة

اجعل الروتين:
- واقعياً وقابل للتطبيق
- متوازناً (لا يرهق المستخدم)
- متدرجاً حسب المستوى
- موزعاً على مدار اليوم

أرجع النتيجة بصيغة JSON:
{
  "routine": [
    {
      "time": "05:00",
      "activity": "اسم النشاط",
      "description": "الوصف",
      "duration": "المدة بالدقائق",
      "points": "النقاط المتوقعة",
      "priority": "high/medium/low"
    }
  ],
  "tips": ["نصيحة 1", "نصيحة 2"]
}
`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].text);

    } catch (error) {
      console.error('Claude Routine Error:', error);
      throw error;
    }
  }

  /**
   * تحليل تقرير أسبوعي
   */
  async analyzeWeeklyReport(user, weekStats) {
    try {
      const prompt = `
حلل الأداء الأسبوعي للمستخدم وقدم تقييماً شاملاً.

المستخدم: ${user.name}
المستوى: ${user.profile.level}

إحصائيات الأسبوع:
${JSON.stringify(weekStats, null, 2)}

قدم تحليلاً يتضمن:
1. النقاط الإيجابية (3 نقاط)
2. النقاط التي تحتاج تحسين (2-3 نقاط)
3. تقييم عام (من 10)
4. هدف الأسبوع القادم
5. نصيحة محورية واحدة

أرجع النتيجة بصيغة JSON:
{
  "positives": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "improvements": ["نقطة 1", "نقطة 2"],
  "rating": 8,
  "nextWeekGoal": "الهدف المقترح",
  "keyAdvice": "النصيحة المحورية",
  "motivationalMessage": "رسالة تحفيزية"
}
`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].text);

    } catch (error) {
      console.error('Claude Weekly Report Error:', error);
      throw error;
    }
  }

  /**
   * كشف الأنماط السلبية واقتراح حلول
   */
  async detectNegativePatterns(userId, recentData) {
    try {
      const prompt = `
أنت محلل سلوكي متخصص في العبادات. حلل البيانات التالية وحدد الأنماط السلبية.

البيانات الأخيرة (30 يوم):
${JSON.stringify(recentData, null, 2)}

ابحث عن:
- أيام معينة تتكرر فيها المشاكل (مثلاً: دائماً يفوت الفجر يوم الإثنين)
- أوقات معينة (مثلاً: ضعف في العبادة آخر الأسبوع)
- تأثير الظروف (عمل، نوم متأخر، إلخ)

أرجع النتيجة بصيغة JSON:
{
  "patterns": [
    {
      "pattern": "وصف النمط",
      "frequency": "كم مرة يحدث",
      "impact": "التأثير",
      "suggestedFix": "الحل المقترح"
    }
  ],
  "insights": ["ملاحظة 1", "ملاحظة 2"]
}
`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].text);

    } catch (error) {
      console.error('Claude Pattern Detection Error:', error);
      throw error;
    }
  }

  /**
   * بناء prompt التحليل
   */
  _buildAnalysisPrompt(user, prayerHistory, quranHistory) {
    return `
أنت محلل خبير في سلوك العبادات. حلل البيانات التالية بدقة.

معلومات المستخدم:
- الاسم: ${user.name}
- المستوى: ${user.profile.level}
- الشريط الحالي: ${user.stats.currentStreak} يوم
- أطول شريط: ${user.stats.longestStreak} يوم
- إجمالي النقاط: ${user.stats.totalPoints}

سجل الصلوات (آخر 30 يوم):
${JSON.stringify(prayerHistory.slice(0, 50), null, 2)}

سجل القرآن (آخر 30 يوم):
${JSON.stringify(quranHistory.slice(0, 20), null, 2)}

قم بتحليل:
1. **نقاط القوة**: ما هي العبادات التي يحافظ عليها المستخدم؟
2. **نقاط الضعف**: ما هي العبادات المتأخرة أو الفائتة؟
3. **الاتجاهات**: هل الأداء يتحسن أم يتراجع؟
4. **الأنماط**: هل هناك أنماط متكررة؟ (مثلاً: يفوت الفجر دائماً)
5. **التوصيات**: 3 توصيات عملية محددة

أرجع النتيجة بصيغة JSON فقط:
{
  "strengths": ["قوة 1", "قوة 2"],
  "weaknesses": ["ضعف 1", "ضعف 2"],
  "trends": {
    "prayers": "تحسن/تراجع/ثابت",
    "quran": "تحسن/تراجع/ثابت",
    "overall": "تحسن/تراجع/ثابت"
  },
  "patterns": ["نمط 1", "نمط 2"],
  "recommendations": [
    {
      "title": "العنوان",
      "description": "الوصف",
      "priority": "high/medium/low"
    }
  ],
  "overallScore": 7.5,
  "summary": "ملخص عام في سطرين"
}
`;
  }
}

module.exports = new ClaudeService();
