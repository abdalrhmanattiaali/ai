const axios = require('axios');
const appConfig = require('../config/app.config');

class WeatherService {
  constructor() {
    this.apiKey = appConfig.weather.apiKey;
    this.baseUrl = appConfig.weather.baseUrl;
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 3600000; // 1 hour
  }

  /**
   * الحصول على الطقس الحالي
   */
  async getCurrentWeather(city) {
    try {
      // التحقق من الكاش
      const cacheKey = `weather_${city}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // جلب من API
      if (!this.apiKey) {
        console.warn('⚠️  Weather API key not configured');
        return this.getDefaultWeatherData();
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: appConfig.weather.units,
          lang: appConfig.weather.lang
        }
      });

      const weatherData = {
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon,
        city: response.data.name
      };

      // حفظ في الكاش
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      console.error('❌ Error fetching weather:', error.message);
      return this.getDefaultWeatherData();
    }
  }

  /**
   * اقتراحات بناءً على الطقس
   */
  getSuggestionsByWeather(weather, childAge = 3) {
    const suggestions = {
      clothing: [],
      activities: [],
      precautions: []
    };

    const temp = weather.temperature;

    // اقتراحات الملابس
    if (temp > 30) {
      suggestions.clothing = ['ملابس خفيفة قطنية', 'قبعة للحماية من الشمس', 'نظارة شمسية'];
      suggestions.precautions = ['استخدام واقي الشمس', 'شرب الماء بكثرة', 'تجنب الشمس بين 11 ص - 3 م'];
    } else if (temp > 20) {
      suggestions.clothing = ['ملابس مريحة', 'سترة خفيفة للمساء'];
    } else if (temp > 15) {
      suggestions.clothing = ['ملابس دافئة', 'جاكيت', 'حذاء مغلق'];
    } else {
      suggestions.clothing = ['ملابس شتوية دافئة', 'معطف ثقيل', 'قفازات', 'وشاح'];
      suggestions.precautions = ['حماية الأطراف من البرد', 'شرب مشروبات دافئة'];
    }

    // اقتراحات الأنشطة
    if (weather.condition === 'Clear' && temp > 20 && temp < 35) {
      suggestions.activities = [
        'اللعب في الحديقة',
        'ركوب الدراجة',
        'نزهة عائلية',
        'اللعب بالكرة في الخارج'
      ];
    } else if (weather.condition === 'Rain') {
      suggestions.activities = [
        'الرسم والتلوين',
        'قراءة القصص',
        'الألعاب الإبداعية في المنزل',
        'مشاهدة فيلم تعليمي',
        'اللعب بالعجين'
      ];
      suggestions.precautions = ['البقاء في المنزل', 'إغلاق النوافذ'];
    } else if (temp > 35) {
      suggestions.activities = [
        'اللعب في الماء (تحت الإشراف)',
        'أنشطة داخلية مكيفة',
        'القراءة في مكان بارد',
        'ألعاب هادئة'
      ];
    } else {
      suggestions.activities = [
        'أنشطة داخلية',
        'الحرف اليدوية',
        'الألعاب التعليمية',
        'الطبخ مع الوالدين'
      ];
    }

    return suggestions;
  }

  /**
   * تنسيق رسالة الطقس
   */
  formatWeatherMessage(weather, city, childNickname) {
    const emoji = this.getWeatherEmoji(weather.condition);
    const suggestions = this.getSuggestionsByWeather(weather);

    return `
🌤️ *حالة الطقس في ${city}*

${emoji} ${weather.description}
🌡️ الحرارة: ${weather.temperature}°م (تبدو كأنها ${weather.feelsLike}°م)
💨 الرطوبة: ${weather.humidity}%
🌀 الرياح: ${weather.windSpeed} م/ث

👕 *ملابس ${childNickname} اليوم:*
${suggestions.clothing.map(c => `• ${c}`).join('\n')}

🎯 *أنشطة مقترحة:*
${suggestions.activities.slice(0, 3).map(a => `• ${a}`).join('\n')}

${suggestions.precautions.length > 0 ? `\n⚠️ *تنبيهات:*\n${suggestions.precautions.map(p => `• ${p}`).join('\n')}` : ''}
    `.trim();
  }

  /**
   * الحصول على إيموجي الطقس
   */
  getWeatherEmoji(condition) {
    const emojiMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };

    return emojiMap[condition] || '🌤️';
  }

  /**
   * بيانات طقس افتراضية (في حالة فشل API)
   */
  getDefaultWeatherData() {
    return {
      temperature: 25,
      feelsLike: 25,
      condition: 'Clear',
      description: 'طقس معتدل',
      humidity: 60,
      windSpeed: 3,
      icon: '01d',
      city: 'القاهرة'
    };
  }
}

const weatherService = new WeatherService();

module.exports = weatherService;
