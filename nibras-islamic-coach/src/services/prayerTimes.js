const axios = require('axios');
const moment = require('moment-hijri');

/**
 * خدمة أوقات الصلاة
 * تستخدم Aladhan API للحصول على مواقيت الصلاة
 */
class PrayerTimesService {
  constructor() {
    this.baseURL = process.env.ALADHAN_API_URL || 'https://api.aladhan.com/v1';
    this.cache = new Map(); // كاش بسيط للتخزين المؤقت
  }

  /**
   * الحصول على أوقات الصلاة اليوم
   */
  async getToday(location) {
    try {
      const cacheKey = `${location.city}_${location.country}_${moment().format('YYYY-MM-DD')}`;

      // تحقق من الكاش
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const url = `${this.baseURL}/timingsByCity`;
      const response = await axios.get(url, {
        params: {
          city: location.city,
          country: location.country,
          method: 5 // Egyptian General Authority of Survey
        }
      });

      const data = response.data.data;
      const timings = this._extractTimings(data.timings);

      // معلومات إضافية
      const result = {
        timings,
        hijriDate: data.date.hijri,
        gregorianDate: data.date.gregorian,
        meta: data.meta
      };

      // حفظ في الكاش
      this.cache.set(cacheKey, result);

      return result;

    } catch (error) {
      console.error('Prayer Times Error:', error);
      throw new Error('فشل في جلب أوقات الصلاة');
    }
  }

  /**
   * الحصول على أوقات الصلاة لشهر كامل
   */
  async getMonthly(location, month, year) {
    try {
      const url = `${this.baseURL}/calendar`;
      const response = await axios.get(url, {
        params: {
          city: location.city,
          country: location.country,
          month,
          year,
          method: 5
        }
      });

      const calendar = response.data.data;
      return calendar.map(day => ({
        date: day.date.readable,
        hijri: day.date.hijri,
        timings: this._extractTimings(day.timings)
      }));

    } catch (error) {
      console.error('Monthly Prayer Times Error:', error);
      throw new Error('فشل في جلب التقويم الشهري');
    }
  }

  /**
   * الحصول على الوقت المتبقي للصلاة القادمة
   */
  getNextPrayer(timings) {
    const now = moment();
    const prayers = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
    const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (let i = 0; i < prayers.length; i++) {
      const prayerTime = moment(timings[prayerKeys[i]], 'HH:mm');

      if (prayerTime.isAfter(now)) {
        const diff = moment.duration(prayerTime.diff(now));

        return {
          prayer: prayers[i],
          time: timings[prayerKeys[i]],
          remaining: {
            hours: Math.floor(diff.asHours()),
            minutes: diff.minutes(),
            seconds: diff.seconds(),
            total: diff.asMinutes()
          }
        };
      }
    }

    // إذا انتهى اليوم، الصلاة القادمة هي الفجر غداً
    const fajrTomorrow = moment(timings.Fajr, 'HH:mm').add(1, 'day');
    const diff = moment.duration(fajrTomorrow.diff(now));

    return {
      prayer: 'الفجر',
      time: timings.Fajr,
      tomorrow: true,
      remaining: {
        hours: Math.floor(diff.asHours()),
        minutes: diff.minutes(),
        seconds: diff.seconds(),
        total: diff.asMinutes()
      }
    };
  }

  /**
   * التحقق من دخول وقت صلاة
   */
  isPrayerTime(timings, prayer, minutesBefore = 0) {
    const now = moment();
    const prayerMap = {
      'فجر': 'Fajr',
      'ظهر': 'Dhuhr',
      'عصر': 'Asr',
      'مغرب': 'Maghrib',
      'عشاء': 'Isha'
    };

    const prayerKey = prayerMap[prayer];
    if (!prayerKey) return false;

    const prayerTime = moment(timings[prayerKey], 'HH:mm');
    if (minutesBefore > 0) {
      prayerTime.subtract(minutesBefore, 'minutes');
    }

    // تحقق إذا كان الوقت الآن = وقت الصلاة (في نفس الدقيقة)
    return now.isSame(prayerTime, 'minute');
  }

  /**
   * الحصول على التاريخ الهجري
   */
  getHijriDate() {
    const hijri = moment().format('iYYYY/iM/iD');
    const parts = hijri.split('/');

    const monthNames = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
      'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];

    return {
      day: parseInt(parts[2]),
      month: monthNames[parseInt(parts[1]) - 1],
      monthNumber: parseInt(parts[1]),
      year: parseInt(parts[0]),
      formatted: `${parts[2]} ${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}`
    };
  }

  /**
   * التحقق من المناسبات الإسلامية
   */
  getIslamicOccasion() {
    const hijri = this.getHijriDate();
    const occasions = [];

    // رمضان
    if (hijri.monthNumber === 9) {
      occasions.push({
        name: 'رمضان',
        type: 'month',
        description: 'شهر رمضان المبارك'
      });

      // ليلة القدر
      if (hijri.day >= 21 && hijri.day % 2 === 1) {
        occasions.push({
          name: 'ليلة القدر المحتملة',
          type: 'special',
          description: `الليلة ${hijri.day} من رمضان`
        });
      }
    }

    // عشر ذي الحجة
    if (hijri.monthNumber === 12 && hijri.day <= 10) {
      occasions.push({
        name: 'عشر ذي الحجة',
        type: 'special',
        description: 'أيام معدودات'
      });

      // يوم عرفة
      if (hijri.day === 9) {
        occasions.push({
          name: 'يوم عرفة',
          type: 'major',
          description: 'يوم الحج الأكبر'
        });
      }

      // عيد الأضحى
      if (hijri.day === 10) {
        occasions.push({
          name: 'عيد الأضحى',
          type: 'eid',
          description: 'العيد الكبير'
        });
      }
    }

    // عيد الفطر
    if (hijri.monthNumber === 10 && hijri.day === 1) {
      occasions.push({
        name: 'عيد الفطر',
        type: 'eid',
        description: 'عيد الفطر المبارك'
      });
    }

    // عاشوراء
    if (hijri.monthNumber === 1 && hijri.day === 10) {
      occasions.push({
        name: 'عاشوراء',
        type: 'special',
        description: 'يوم صيام مستحب'
      });
    }

    // ليلة الإسراء والمعراج
    if (hijri.monthNumber === 7 && hijri.day === 27) {
      occasions.push({
        name: 'الإسراء والمعراج',
        type: 'special',
        description: 'ليلة الإسراء والمعراج'
      });
    }

    // المولد النبوي
    if (hijri.monthNumber === 3 && hijri.day === 12) {
      occasions.push({
        name: 'المولد النبوي',
        type: 'special',
        description: 'مولد النبي ﷺ'
      });
    }

    return occasions;
  }

  /**
   * الحصول على يوم الأسبوع بالعربي
   */
  getArabicDayName() {
    const days = [
      'الأحد', 'الإثنين', 'الثلاثاء',
      'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];
    return days[moment().day()];
  }

  /**
   * التحقق من يوم الجمعة
   */
  isFriday() {
    return moment().day() === 5;
  }

  /**
   * التحقق من أيام الصيام المستحبة
   */
  getRecommendedFasting() {
    const hijri = this.getHijriDate();
    const dayOfWeek = moment().day();
    const dayOfMonth = hijri.day;

    const fasting = [];

    // الإثنين والخميس
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      fasting.push({
        name: 'صيام الإثنين والخميس',
        reason: 'سنة النبي ﷺ',
        type: 'weekly'
      });
    }

    // الأيام البيض (13، 14، 15 من كل شهر هجري)
    if ([13, 14, 15].includes(dayOfMonth)) {
      fasting.push({
        name: 'الأيام البيض',
        reason: `اليوم ${dayOfMonth} من الشهر الهجري`,
        type: 'monthly'
      });
    }

    // رمضان
    if (hijri.monthNumber === 9) {
      fasting.push({
        name: 'صيام رمضان',
        reason: 'فرض',
        type: 'obligatory'
      });
    }

    // عاشوراء وما حوله
    if (hijri.monthNumber === 1 && [9, 10, 11].includes(dayOfMonth)) {
      fasting.push({
        name: 'صيام عاشوراء',
        reason: 'يوم عاشوراء وما حوله',
        type: 'special'
      });
    }

    // عرفة (لغير الحاج)
    if (hijri.monthNumber === 12 && dayOfMonth === 9) {
      fasting.push({
        name: 'صيام يوم عرفة',
        reason: 'يكفر سنتين',
        type: 'special'
      });
    }

    return fasting;
  }

  /**
   * استخراج الأوقات المهمة فقط
   */
  _extractTimings(timings) {
    return {
      Fajr: timings.Fajr,
      Sunrise: timings.Sunrise,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha,
      Midnight: timings.Midnight,
      Lastthird: timings.Lastthird
    };
  }

  /**
   * تنظيف الكاش (يُستدعى يومياً)
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new PrayerTimesService();
