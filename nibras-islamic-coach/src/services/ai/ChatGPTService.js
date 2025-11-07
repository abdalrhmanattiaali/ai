const OpenAI = require('openai');

/**
 * خدمة ChatGPT للمحتوى الديني والتفاعل
 * تستخدم لـ:
 * - المحتوى الديني التفاعلي
 * - الإجابة على الأسئلة الشرعية
 * - توليد الأدعية والأذكار
 * - الدروس والفوائد الدينية
 */
class ChatGPTService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'gpt-4-turbo-preview';
  }

  /**
   * الإجابة على سؤال شرعي
   */
  async answerIslamicQuestion(question, userLevel = 'متوسط') {
    try {
      const systemPrompt = `
أنت عالم إسلامي متخصص وموثوق. تجيب على الأسئلة الشرعية بناءً على:
- القرآن الكريم
- السنة النبوية الصحيحة
- إجماع العلماء
- أقوال العلماء المعتبرين

مستوى المستخدم: ${userLevel}

قواعد الإجابة:
1. ابدأ بالدليل من القرآن أو السنة
2. اذكر المصدر (السورة والآية، أو صحة الحديث)
3. كن واضحاً ومختصراً
4. لو كان هناك خلاف، اذكر الأقوال المختلفة باختصار
5. لو كنت غير متأكد، قل "والله أعلم" أو "يُرجى سؤال عالم متخصص"

نبرة الإجابة: علمية، لطيفة، محفزة
`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('ChatGPT Question Error:', error);
      throw error;
    }
  }

  /**
   * توليد محتوى يومي (آية، حديث، دعاء، فائدة)
   */
  async generateDailyContent(type, context = {}) {
    try {
      const prompts = {
        'آية': `
أعطني آية قرآنية مناسبة ${context.occasion ? `لمناسبة ${context.occasion}` : 'لليوم'}.
مع:
1. الآية بالعربية الفصحى
2. اسم السورة ورقم الآية
3. تفسير مختصر (2-3 أسطر)
4. فائدة عملية من الآية

الرد بصيغة JSON:
{
  "ayah": "الآية",
  "surah": "السورة",
  "ayahNumber": رقم,
  "tafsir": "التفسير",
  "benefit": "الفائدة العملية"
}
`,

        'حديث': `
أعطني حديثاً نبوياً صحيحاً ${context.topic ? `عن ${context.topic}` : ''}.
مع:
1. نص الحديث
2. الراوي
3. درجة الحديث (صحيح، حسن)
4. المصدر (البخاري، مسلم، الترمذي، إلخ)
5. شرح مختصر
6. فائدة عملية

الرد بصيغة JSON:
{
  "hadith": "نص الحديث",
  "narrator": "الراوي",
  "grade": "صحيح/حسن",
  "source": "المصدر",
  "explanation": "الشرح",
  "benefit": "الفائدة"
}
`,

        'دعاء': `
اقترح دعاءً مناسباً ${context.time ? `لوقت ${context.time}` : ''} ${context.situation ? `في حالة ${context.situation}` : ''}.
الدعاء يجب أن يكون:
1. من القرآن أو السنة (يفضل)
2. أو دعاء مأثور
3. قصير وسهل الحفظ

مع:
- نص الدعاء
- المصدر (إن وجد)
- فضله
- الوقت المناسب

الرد بصيغة JSON:
{
  "duaa": "نص الدعاء",
  "source": "المصدر",
  "virtue": "الفضل",
  "bestTime": "الوقت المناسب"
}
`,

        'ذكر': `
اقترح ذكراً ${context.occasion ? `لـ${context.occasion}` : 'مناسب'}.
مع:
1. نص الذكر
2. عدد المرات المقترح
3. الفضل
4. المصدر

الرد بصيغة JSON:
{
  "dhikr": "النص",
  "count": العدد,
  "virtue": "الفضل",
  "source": "المصدر"
}
`,

        'درس': `
اكتب درساً دينياً قصيراً (5-7 أسطر) ${context.topic ? `عن ${context.topic}` : ''}.
المستوى: ${context.level || 'متوسط'}

الدرس يجب أن يكون:
- واضح ومفيد
- مدعم بالأدلة
- عملي وقابل للتطبيق

الرد بصيغة JSON:
{
  "title": "العنوان",
  "content": "المحتوى",
  "references": ["مرجع1", "مرجع2"],
  "actionItems": ["تطبيق عملي 1", "تطبيق عملي 2"]
}
`,

        'فائدة': `
اكتب فائدة دينية قصيرة ومفيدة ${context.category ? `في ${context.category}` : ''}.
(3-4 أسطر فقط)

الرد كنص مباشر.
`
      };

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'أنت عالم إسلامي متخصص في إنتاج محتوى ديني قيم ومختصر.'
          },
          {
            role: 'user',
            content: prompts[type] || prompts['فائدة']
          }
        ],
        max_tokens: 800,
        temperature: 0.8
      });

      const content = response.choices[0].message.content;

      // محاولة parse JSON، وإلا نعيد النص مباشرة
      try {
        return JSON.parse(content);
      } catch {
        return { content };
      }

    } catch (error) {
      console.error('ChatGPT Daily Content Error:', error);
      throw error;
    }
  }

  /**
   * توليد رسالة جماعية للمجموعة
   */
  async generateGroupMessage(type, data) {
    try {
      let prompt = '';

      switch(type) {
        case 'weekly_stats':
          prompt = `
أنشئ رسالة محفزة لمجموعة واتساب عن إحصائيات الأسبوع.

البيانات:
- عدد الأعضاء النشطين: ${data.activeMembers}
- متوسط الصلوات: ${data.avgPrayers}%
- صفحات القرآن المقروءة: ${data.totalQuranPages}
- المتصدرون: ${JSON.stringify(data.topUsers)}

الرسالة يجب أن:
- تبدأ بتحية
- تعرض الإحصائيات بشكل جذاب
- تهنئ المتصدرين
- تحفز الآخرين
- تنتهي بدعاء أو تشجيع

استخدم الإيموجي بشكل مناسب.
الرد كنص مباشر (ليس JSON).
`;
          break;

        case 'reminder':
          prompt = `
اكتب تذكيراً لطيفاً للمجموعة عن: ${data.topic}

المناسبة: ${data.occasion || 'عامة'}
الطول: قصير (3-5 أسطر)
النبرة: محفزة ولطيفة

استخدم:
- آية أو حديث قصير (اختياري)
- دعوة للعمل
- إيموجي مناسب
`;
          break;

        case 'challenge':
          prompt = `
اكتب إعلاناً عن تحدي جماعي:
الموضوع: ${data.challenge}
المدة: ${data.duration}
المكافأة: ${data.reward}

اجعله:
- محفزاً
- واضح الأهداف
- يشجع على المشاركة
`;
          break;
      }

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'أنت مدير مجموعة إسلامية محترف. تكتب رسائل محفزة ومحببة.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.9
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('ChatGPT Group Message Error:', error);
      throw error;
    }
  }

  /**
   * شرح مفهوم إسلامي
   */
  async explainConcept(concept, level = 'متوسط') {
    try {
      const prompt = `
اشرح المفهوم الإسلامي التالي: "${concept}"

مستوى الشرح: ${level}

الشرح يجب أن يتضمن:
1. التعريف اللغوي والاصطلاحي
2. الأدلة من القرآن والسنة
3. الحكمة من هذا المفهوم
4. أمثلة عملية
5. كيفية التطبيق في الحياة اليومية

الطول: متوسط (8-12 سطر)

الرد بصيغة JSON:
{
  "definition": "التعريف",
  "evidence": ["دليل 1", "دليل 2"],
  "wisdom": "الحكمة",
  "examples": ["مثال 1", "مثال 2"],
  "application": "كيفية التطبيق"
}
`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'أنت معلم إسلامي ماهر في تبسيط المفاهيم الشرعية.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1200,
        temperature: 0.7
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('ChatGPT Concept Error:', error);
      throw error;
    }
  }

  /**
   * توليد قصة تربوية
   */
  async generateStory(topic, length = 'short') {
    try {
      const lengths = {
        short: 'قصيرة (5-7 أسطر)',
        medium: 'متوسطة (10-15 سطر)',
        long: 'طويلة (20+ سطر)'
      };

      const prompt = `
اكتب قصة تربوية إسلامية عن: ${topic}

الطول: ${lengths[length]}

القصة يجب أن:
- تكون من السيرة النبوية أو قصص الصحابة أو السلف (يفضل)
- تحتوي على عبرة واضحة
- تكون ملهمة ومحفزة
- سهلة الفهم

الرد بصيغة JSON:
{
  "title": "العنوان",
  "story": "القصة",
  "moral": "العبرة",
  "source": "المصدر (إن وجد)"
}
`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'أنت راوي قصص إسلامية ماهر.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.9
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('ChatGPT Story Error:', error);
      throw error;
    }
  }

  /**
   * محادثة عامة مع البوت
   */
  async chat(userMessage, context = {}) {
    try {
      const systemPrompt = `
أنت "نبراس" - مساعد ديني ذكي ولطيف.

مهمتك:
- مساعدة المستخدمين في رحلتهم الدينية
- تقديم نصائح دينية
- الإجابة على أسئلة شرعية بسيطة
- تحفيز وتشجيع

قواعد:
1. كن لطيفاً ومحترماً
2. اجعل إجاباتك مختصرة (3-5 أسطر)
3. إذا كان السؤال معقداً شرعياً، انصح بسؤال عالم متخصص
4. استخدم الإيموجي بشكل خفيف
5. حفز المستخدم على الخير

${context.userName ? `اسم المستخدم: ${context.userName}` : ''}
${context.userLevel ? `المستوى: ${context.userLevel}` : ''}
`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.8
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('ChatGPT Chat Error:', error);
      throw error;
    }
  }
}

module.exports = new ChatGPTService();
