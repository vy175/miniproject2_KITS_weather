const { CITIES, WMO_CODES } = require('../config/cities');
const cacheService = require('./cacheService');
const alertService = require('./alertService');

/**
 * Service: Third-party Open-Meteo API Gateway & Data Normalization
 */
class WeatherService {
  /**
   * Search any city globally via Open-Meteo Geocoding API
   */
  async searchCities(query) {
    if (!query || query.trim().length === 0) return [];

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=vi`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.results) return [];

      return data.results.map(item => ({
        id: item.id,
        name: item.name,
        country: item.country || "",
        admin1: item.admin1 || "",
        lat: item.latitude,
        lon: item.longitude
      }));
    } catch (err) {
      console.warn("[Geocoding Search Error]:", err.message);
      return [];
    }
  }

  /**
   * Fetch weather by Coordinates OR predefined city key OR coordinate key (e.g. 23.73_114.68)
   */
  async getWeather({ cityKey, lat, lon, name, country }) {
    let resolvedLat, resolvedLon, resolvedName, resolvedCountry, resolvedKey;

    // 1. Trường hợp truyền tọa độ trực tiếp
    if (lat !== undefined && lon !== undefined) {
      resolvedLat = Number(lat);
      resolvedLon = Number(lon);
      resolvedName = name || `${resolvedLat.toFixed(2)}, ${resolvedLon.toFixed(2)}`;
      resolvedCountry = country || "";
      resolvedKey = `${resolvedLat.toFixed(2)}_${resolvedLon.toFixed(2)}`;
    } 
    // 2. Trường hợp truyền cityKey dạng tọa độ (VD: 23.73_114.68 do click từ lịch sử)
    else if (cityKey && cityKey.includes('_')) {
      const parts = cityKey.split('_');
      resolvedLat = Number(parts[0]);
      resolvedLon = Number(parts[1]);
      resolvedKey = cityKey;

      // Ưu tiên kiểm tra cache để lấy lại tên thành phố
      const cached = cacheService.get(resolvedKey);
      if (cached) {
        return { data: cached, cached: true };
      }
      resolvedName = name || `${resolvedLat.toFixed(2)}, ${resolvedLon.toFixed(2)}`;
      resolvedCountry = country || "";
    }
    // 3. Trường hợp truyền cityKey thông thường (hanoi, tokyo...)
    else if (cityKey) {
      const key = cityKey.toLowerCase();
      const cityInfo = CITIES[key];
      if (!cityInfo) {
        const err = new Error(`Thành phố '${cityKey}' không được tìm thấy.`);
        err.statusCode = 404;
        throw err;
      }
      resolvedLat = cityInfo.lat;
      resolvedLon = cityInfo.lon;
      resolvedName = cityInfo.name;
      resolvedCountry = cityInfo.country;
      resolvedKey = key;
    } else {
      const err = new Error("Thiếu tham số vị trí (city hoặc lat/lon).");
      err.statusCode = 400;
      throw err;
    }

    // Check persistent SQLite cache
    const cachedData = cacheService.get(resolvedKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }

    // Fetch from Open-Meteo Weather API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

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
        key: resolvedKey,
        name: resolvedName,
        country: resolvedCountry,
        lat: resolvedLat,
        lon: resolvedLon
      },
      current: currentMetrics,
      alert,
      elevation: raw.elevation ?? 0,
      updatedAt: new Date().toISOString()
    };

    // Save to SQLite Cache & Search History
    cacheService.set(resolvedKey, normalizedData);
    cacheService.addHistory(resolvedKey, resolvedName, normalizedData.current.temperature, condition.desc);

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

    const [res1, res2] = await Promise.all([
      this.getWeather({ cityKey: cityKey1 }),
      this.getWeather({ cityKey: cityKey2 })
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
