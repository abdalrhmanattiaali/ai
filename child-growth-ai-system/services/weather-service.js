const axios = require('axios');
require('dotenv').config();

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.city = process.env.WEATHER_CITY || 'Cairo,EG';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather() {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ Weather API Key غير موجود');
        return this.getDefaultWeather();
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: this.city,
          appid: this.apiKey,
          units: 'metric',
          lang: 'ar'
        }
      });

      const data = response.data;

      return {
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // تحويل من m/s إلى km/h
        icon: data.weather[0].icon,
        city: data.name
      };
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات الطقس:', error.message);
      return this.getDefaultWeather();
    }
  }

  getDefaultWeather() {
    return {
      temp: 25,
      feelsLike: 26,
      description: 'طقس معتدل',
      humidity: 50,
      windSpeed: 10,
      icon: '01d',
      city: 'القاهرة'
    };
  }

  formatWeatherMessage(weather) {
    const emoji = this.getWeatherEmoji(weather.icon);

    return `${emoji} حالة الطقس اليوم في ${weather.city}:
🌡️ درجة الحرارة: ${weather.temp}°C (تشعر بـ ${weather.feelsLike}°C)
☁️ الوصف: ${weather.description}
💧 الرطوبة: ${weather.humidity}%
🌬️ سرعة الرياح: ${weather.windSpeed} كم/س

${this.getWeatherAdvice(weather)}`;
  }

  getWeatherEmoji(icon) {
    const emojiMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '🌨️', '13n': '🌨️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return emojiMap[icon] || '🌤️';
  }

  getWeatherAdvice(weather) {
    if (weather.temp > 35) {
      return '⚠️ الجو حار جداً! احرص على شرب الماء وتجنب الخروج في الظهيرة.';
    } else if (weather.temp > 30) {
      return '☀️ الجو حار، اختر أنشطة داخلية أو اخرج في الصباح الباكر أو المساء.';
    } else if (weather.temp < 10) {
      return '🧥 الجو بارد! ألبس طفلك ملابس دافئة قبل الخروج.';
    } else if (weather.temp < 15) {
      return '🌡️ الجو معتدل يميل للبرودة، ملابس خفيفة مع جاكيت خفيف.';
    } else if (weather.description.includes('مطر') || weather.description.includes('rain')) {
      return '☔ الجو ممطر! خطط لأنشطة داخلية ممتعة.';
    } else if (weather.temp >= 20 && weather.temp <= 28) {
      return '✨ طقس رائع للخروج والاستمتاع بالأنشطة الخارجية!';
    }
    return '🌤️ طقس لطيف اليوم، استمتع بوقتك!';
  }

  async getForecast(days = 3) {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: this.city,
          appid: this.apiKey,
          units: 'metric',
          lang: 'ar',
          cnt: days * 8 // 8 readings per day (every 3 hours)
        }
      });

      return response.data.list;
    } catch (error) {
      console.error('❌ خطأ في جلب توقعات الطقس:', error.message);
      return null;
    }
  }
}

module.exports = new WeatherService();
