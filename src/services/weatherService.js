const { CITIES, WMO_CODES } = require('../config/cities');
const cacheService = require('./cacheService');
const alertService = require('./alertService');

/**
 * Service: Third-party Open-Meteo API Gateway & Data Normalization
 */
class WeatherService {
  async getWeatherByCity(cityKey) {
    const key = cityKey.toLowerCase();
    const cityInfo = CITIES[key];

    if (!cityInfo) {
      const err = new Error(`Thành phố '${cityKey}' không được hỗ trợ trong danh mục.`);
      err.statusCode = 404;
      throw err;
    }

    // Check persistent SQLite cache first
    const cachedData = cacheService.get(key);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }

    // Fetch from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    let apiRes;
    try {
      apiRes = await fetch(url, { signal: controller.signal });
    } catch (networkError) {
      if (networkError.name === 'AbortError') {
        const timeoutErr = new Error("Quá thời gian kết nối tới Open-Meteo API (Timeout 7s).");
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      throw networkError;
    } finally {
      clearTimeout(timeout);
    }

    if (!apiRes.ok) {
      const err = new Error(`Open-Meteo phản hồi mã lỗi HTTP ${apiRes.status}`);
      err.statusCode = 502;
      throw err;
    }

    const raw = await apiRes.json();
    const current = raw.current;
    const condition = WMO_CODES[current.weather_code] || { desc: "Không xác định", icon: "help-circle" };

    const currentMetrics = {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      weatherDescription: condition.desc,
      weatherIcon: condition.icon,
      time: current.time
    };

    const alert = alertService.analyze(currentMetrics);

    const normalizedData = {
      city: {
        key,
        name: cityInfo.name,
        country: cityInfo.country,
        lat: cityInfo.lat,
        lon: cityInfo.lon
      },
      current: currentMetrics,
      alert,
      elevation: raw.elevation ?? 0,
      updatedAt: new Date().toISOString()
    };

    // Save to SQLite Cache & Search History
    cacheService.set(key, normalizedData);
    cacheService.addHistory(key, cityInfo.name, normalizedData.current.temperature, condition.desc);

    return { data: normalizedData, cached: false };
  }

  async compareCities(cityKey1, cityKey2) {
    if (!cityKey1 || !cityKey2) {
      const err = new Error("Yêu cầu cung cấp đủ 2 thành phố để so sánh.");
      err.statusCode = 400;
      throw err;
    }

    if (cityKey1.toLowerCase() === cityKey2.toLowerCase()) {
      const err = new Error("Vui lòng chọn 2 thành phố khác nhau để so sánh.");
      err.statusCode = 400;
      throw err;
    }

    // Parallel fetching via Promise.all
    const [res1, res2] = await Promise.all([
      this.getWeatherByCity(cityKey1),
      this.getWeatherByCity(cityKey2)
    ]);

    const c1 = res1.data;
    const c2 = res2.data;

    const tempDiff = c1.current.temperature - c2.current.temperature;
    const humidityDiff = c1.current.humidity - c2.current.humidity;
    const windDiff = Number((c1.current.windSpeed - c2.current.windSpeed).toFixed(1));

    let comparisonSummary = "";
    if (tempDiff > 0) {
      comparisonSummary = `${c1.city.name} đang ấm/nóng hơn ${c2.city.name} ${Math.abs(tempDiff)}°C. `;
    } else if (tempDiff < 0) {
      comparisonSummary = `${c1.city.name} đang lạnh hơn ${c2.city.name} ${Math.abs(tempDiff)}°C. `;
    } else {
      comparisonSummary = `Nhiệt độ tại ${c1.city.name} và ${c2.city.name} bằng nhau (${c1.current.temperature}°C). `;
    }

    if (humidityDiff > 15) {
      comparisonSummary += `Độ ẩm tại ${c1.city.name} cao hơn đáng kể (+${humidityDiff}%).`;
    } else if (humidityDiff < -15) {
      comparisonSummary += `Không khí tại ${c2.city.name} ẩm hơn đáng kể (+${Math.abs(humidityDiff)}%).`;
    }

    return {
      city1: c1,
      city2: c2,
      delta: { tempDiff, humidityDiff, windDiff },
      summary: comparisonSummary
    };
  }
}

module.exports = new WeatherService();
