const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
  }

  async generateResponse(prompt, context = {}) {
    try {
      if (this.provider === 'openai') {
        return await this.generateOpenAIResponse(prompt, context);
      } else if (this.provider === 'anthropic') {
        return await this.generateAnthropicResponse(prompt, context);
      } else {
        throw new Error('AI Provider غير مدعوم');
      }
    } catch (error) {
      console.error('❌ خطأ في AI Service:', error.message);
      return 'عذراً، حدث خطأ في النظام. الرجاء المحاولة لاحقاً.';
    }
  }

  async generateOpenAIResponse(prompt, context) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  async generateAnthropicResponse(prompt, context) {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: this.getSystemPrompt(context),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.content[0].text;
  }

  getSystemPrompt(context) {
    const { childInfo, parentInfo, recentMemory, activityType } = context;

    let systemPrompt = `أنت مساعد ذكي متخصص في تطوير ونمو الأطفال، ومساعدة الآباء والأمهات في رحلة تربية أطفالهم.

مهمتك هي:
1. تقديم نصائح علمية ومفيدة ومخصصة
2. تتبع تطور الطفل والاهتمام بالتفاصيل
3. اقتراح أنشطة وتمارين وألعاب مناسبة للعمر
4. ترشيح كتب ودورات وكورسات ومقاطع يوتيوب مفيدة
5. تقديم دعم نفسي وعاطفي للوالدين
6. المساعدة في التخطيط اليومي والروتين
7. اقتراح أماكن فسح وخروجات مناسبة للطفل

تحدث بأسلوب ودود وداعم ومحفز، واستخدم اللغة العربية الفصحى السهلة.
`;

    if (childInfo) {
      systemPrompt += `\n\nمعلومات الطفل:
- الاسم: ${childInfo.name}
- اسم الدلع: ${childInfo.nickname || 'غير محدد'}
- تاريخ الميلاد: ${childInfo.birth_date}
- الوزن: ${childInfo.weight || 'غير محدد'} كجم
- الطول: ${childInfo.height || 'غير محدد'} سم
- الجنس: ${childInfo.gender || 'غير محدد'}`;
    }

    if (parentInfo) {
      systemPrompt += `\n\nمعلومات ولي الأمر:
- النوع: ${parentInfo.type === 'father' ? 'الأب' : 'الأم'}
- الاسم: ${parentInfo.name}
- المستوى التعليمي: ${parentInfo.education_level || 'غير محدد'}
- الاهتمامات: ${parentInfo.interests || 'غير محدد'}`;
    }

    if (recentMemory && recentMemory.length > 0) {
      systemPrompt += `\n\nالذاكرة الحديثة للمحادثات:`;
      recentMemory.slice(0, 5).forEach(mem => {
        systemPrompt += `\n- ${mem.message_type === 'sent' ? 'أرسلت' : 'استقبلت'}: ${mem.content.substring(0, 100)}`;
      });
    }

    if (activityType) {
      systemPrompt += `\n\nنوع المحتوى المطلوب: ${activityType}`;
    }

    return systemPrompt;
  }

  // توليد نصائح الصباح
  async generateMorningTips(childInfo, parentInfo, weather) {
    const prompt = `اكتب نصيحة صباحية مخصصة للوالد، تتضمن:
1. تحية صباحية دافئة
2. نصيحة مرتبطة بعمر الطفل وتطوره
3. اقتراح نشاط أو لعبة لليوم
4. معلومة عن الطقس: ${weather}

اجعل الرسالة قصيرة ومحفزة (3-4 جمل فقط).`;

    return await this.generateResponse(prompt, { childInfo, parentInfo });
  }

  // توليد نصائح منتصف اليوم
  async generateMiddayCheck(childInfo, parentInfo) {
    const prompt = `اكتب رسالة متابعة لمنتصف اليوم تتضمن:
1. سؤال عن سير اليوم
2. نصيحة تغذية أو صحة مناسبة للطفل
3. تشجيع للوالد

اجعل الرسالة قصيرة ودافئة (2-3 جمل).`;

    return await this.generateResponse(prompt, { childInfo, parentInfo });
  }

  // توليد أنشطة المساء
  async generateEveningActivities(childInfo, parentInfo) {
    const prompt = `اقترح نشاطاً مسائياً مناسباً للطفل وعائلته:
1. نشاط عائلي ممتع
2. تمرين أو لعبة حركية
3. وقت للقراءة أو القصص

اجعل الاقتراح عملياً وسهل التنفيذ (3-4 جمل).`;

    return await this.generateResponse(prompt, { childInfo, parentInfo });
  }

  // توليد روتين ما قبل النوم
  async generateBedtimeRoutine(childInfo, parentInfo) {
    const prompt = `اقترح روتين ما قبل النوم للطفل:
1. نصائح لنوم هادئ
2. أنشطة الاسترخاء
3. كلمات تشجيعية للوالدين

اجعل الرسالة هادئة ومطمئنة (3-4 جمل).`;

    return await this.generateResponse(prompt, { childInfo, parentInfo });
  }

  // الرد على رسائل الوالدين
  async respondToParentMessage(message, parentType, context) {
    const prompt = `الوالد أرسل الرسالة التالية: "${message}"

قم بالرد بشكل ودي ومفيد، وحاول:
1. فهم احتياجاته أو مخاوفه
2. تقديم نصيحة عملية إن وجدت
3. طرح أسئلة متابعة إن لزم الأمر
4. تسجيل أي معلومات مهمة

كن متعاطفاً وداعماً في ردك.`;

    return await this.generateResponse(prompt, context);
  }

  // توليد توصيات للكتب
  async recommendBooks(childAge, interests = '') {
    const prompt = `اقترح 3 كتب مناسبة لطفل عمره ${childAge} سنوات${interests ? ` ومهتم بـ ${interests}` : ''}:

قدم لكل كتاب:
1. العنوان
2. المؤلف
3. لماذا هو مناسب (جملة واحدة)

اجعل الرد منظماً ومختصراً.`;

    return await this.generateResponse(prompt, {});
  }

  // توليد توصيات للدورات
  async recommendCourses(targetAudience, topic = '') {
    const prompt = `اقترح 3 دورات أو كورسات مناسبة لـ ${targetAudience}${topic ? ` في موضوع ${topic}` : ''}:

قدم لكل دورة:
1. اسم الدورة
2. المنصة (Coursera, Udemy, إلخ)
3. لماذا هي مفيدة (جملة واحدة)

اجعل الرد منظماً ومختصراً.`;

    return await this.generateResponse(prompt, {});
  }

  // توليد توصيات لمقاطع يوتيوب
  async recommendYouTubeContent(topic, targetAudience) {
    const prompt = `اقترح 3 قنوات أو مقاطع يوتيوب مفيدة عن ${topic} لـ ${targetAudience}:

قدم لكل اقتراح:
1. اسم القناة أو المقطع
2. نوع المحتوى
3. لماذا هو مفيد (جملة واحدة)

ركز على محتوى عربي إن وجد.`;

    return await this.generateResponse(prompt, {});
  }

  // اقتراح أماكن الخروج والفسح
  async suggestOutings(childAge, city, season) {
    const prompt = `اقترح 3 أماكن مناسبة لفسحة عائلية:
- عمر الطفل: ${childAge} سنوات
- المدينة: ${city}
- الموسم: ${season}

لكل مكان، اذكر:
1. اسم المكان
2. نوع النشاط
3. لماذا هو مناسب

اجعل الاقتراحات عملية ومناسبة للطقس.`;

    return await this.generateResponse(prompt, {});
  }

  // تمارين للطفل
  async suggestExercises(childAge) {
    const prompt = `اقترح 3 تمارين حركية مناسبة لطفل عمره ${childAge} سنوات:

لكل تمرين:
1. اسم التمرين
2. كيفية تنفيذه (2-3 خطوات بسيطة)
3. الفائدة

اجعل التمارين آمنة وممتعة.`;

    return await this.generateResponse(prompt, {});
  }
}

module.exports = new AIService();
