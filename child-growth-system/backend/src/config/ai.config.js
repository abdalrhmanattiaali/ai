module.exports = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || null,
    models: {
      chat: 'gpt-4',
      chatFast: 'gpt-3.5-turbo',
      embedding: 'text-embedding-ada-002'
    },
    defaultSettings: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    models: {
      chat: 'claude-3-5-sonnet-20241022',
      chatFast: 'claude-3-haiku-20240307'
    },
    defaultSettings: {
      maxTokens: 2000,
      temperature: 0.7
    }
  },

  systemMessages: {
    default: `أنت مساعد ذكي متخصص في التربية ونمو الأطفال. اسمك "رفيق النمو".
تتحدث بلغة عربية فصحى سهلة ودافئة. أنت متعاطف، داعم، ومبني على أسس علمية تربوية.
مهمتك مساعدة الآباء والأمهات في متابعة تطور أطفالهم وتقديم نصائح مخصصة.`,

    conversational: `أنت "رفيق النمو"، مساعد تربوي ذكي يتحدث مع الآباء عبر واتساب.
تحدث بأسلوب ودود وطبيعي، كأنك صديق خبير في التربية.
استخدم الإيموجي بشكل معتدل لتجعل المحادثة أكثر حيوية.
استمع جيداً لمخاوف الآباء وقدم نصائح عملية ومبنية على أساس علمي.`,

    recommendations: `أنت خبير تربوي متخصص في تصميم أنشطة وتوصيات للأطفال.
قدم توصيات مبتكرة، عملية، وآمنة ومناسبة لعمر الطفل.
اشرح الفوائد التطويرية لكل نشاط بوضوح.`,

    analysis: `أنت خبير في تحليل نمو وتطور الأطفال.
قدم تحليلات مبنية على البيانات والمعايير العالمية.
كن دقيقاً، موضوعياً، ومطمئناً في نفس الوقت.`
  }
};
