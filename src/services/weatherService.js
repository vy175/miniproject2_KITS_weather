const { CITIES, WMO_CODES } = require('../config/cities');
const cacheService = require('./cacheService');
const alertService = require('./alertService');

/**
 * Service: Third-party Open-Meteo API Gateway with Rate-limit Resilience (429 Fallback)
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
      const res = await fetch(url, {
        headers: { 'User-Agent': 'WeatherApp-StudentProject/1.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        return this.searchLocalCities(query);
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return this.searchLocalCities(query);
      }

      return data.results.map(item => ({
        id: item.id,
        name: item.name,
        country: item.country || "",
        admin1: item.admin1 || "",
        lat: item.latitude,
        lon: item.longitude
      }));
    } catch (err) {
      console.warn("[Geocoding Search Error, fallback to local]:", err.message);
      return this.searchLocalCities(query);
    }
  }

  searchLocalCities(query) {
    const q = query.toLowerCase();
    return Object.entries(CITIES)
      .filter(([key, data]) => data.name.toLowerCase().includes(q) || key.includes(q))
      .map(([key, data]) => ({
        id: key,
        name: data.name,
        country: data.country,
        admin1: "",
        lat: data.lat,
        lon: data.lon
      }));
  }

  /**
   * Sinh dữ liệu mô phỏng an toàn khi bị Open-Meteo chặn 429 trên Cloud IP
   * Phân tích vĩ độ chính xác: Vùng hàn đới/ôn đới sẽ mô phỏng trời rét hoặc tuyết/mưa phùn thực tế
   */
  generateFallbackWeatherData(cityKey, name, country, lat, lon) {
    const numLat = Number(lat);
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;

    let temp = 25;
    let weatherCode = 1;
    let weatherDesc = "Phần lớn trời quang";
    let humidity = 70;
    let windSpeed = 8.0;

    // Vùng cực & hàn đới/ôn đới lạnh (Vĩ độ cao > 50°: Moscow, London, Canada, Bắc Âu)
    if (Math.abs(numLat) >= 50) {
      temp = isNight ? 2 : 5; // Rét buốt dưới 10°C
      weatherCode = 71; // Tuyết rơi nhẹ hoặc rét đậm
      weatherDesc = "Tuyết rơi nhẹ hoặc rét đậm";
      humidity = 88;
      windSpeed = 12.0;
    } 
    // Vùng ôn đới mát (Vĩ độ 30° - 50°: Tokyo, Seoul, Paris, New York)
    else if (Math.abs(numLat) >= 30) {
      temp = isNight ? 12 : 16;
      weatherCode = 2; // Mây rải rác
      weatherDesc = "Mây rải rác";
      humidity = 65;
      windSpeed = 9.5;
    } 
    // Vùng nhiệt đới (Vĩ độ < 30°: Việt Nam, Đông Nam Á)
    else {
      temp = isNight ? 24 : 31;
      weatherCode = 1;
      weatherDesc = "Trời nắng ráo";
      humidity = 78;
      windSpeed = 7.0;
    }

    const currentMetrics = {
      temperature: temp,
      humidity,
      windSpeed,
      weatherCode,
      weatherDescription: weatherDesc,
      weatherIcon: temp <= 10 ? "thermometer" : (isNight ? "moon" : "sun"),
      time: new Date().toISOString()
    };

    const alert = alertService.analyze(currentMetrics);

    return {
      city: {
        key: cityKey,
        name: name,
        country: country || "",
        lat: numLat,
        lon: Number(lon)
      },
      current: currentMetrics,
      alert,
      elevation: 20,
      updatedAt: new Date().toISOString(),
      isFallback: true
    };
  }

  /**
   * Fetch weather with SQLite cache & 429 Graceful Fallback
   */
  async getWeather({ cityKey, lat, lon, name, country }) {
    let resolvedLat, resolvedLon, resolvedName, resolvedCountry, resolvedKey;

    if (lat !== undefined && lon !== undefined) {
      resolvedLat = Number(lat);
      resolvedLon = Number(lon);
      resolvedName = name || `${resolvedLat.toFixed(2)}, ${resolvedLon.toFixed(2)}`;
      resolvedCountry = country || "";
      resolvedKey = `${resolvedLat.toFixed(2)}_${resolvedLon.toFixed(2)}`;
    } else if (cityKey && cityKey.includes('_')) {
      const parts = cityKey.split('_');
      resolvedLat = Number(parts[0]);
      resolvedLon = Number(parts[1]);
      resolvedKey = cityKey;

      const cached = cacheService.get(resolvedKey);
      if (cached) return { data: cached, cached: true };

      resolvedName = name || `${resolvedLat.toFixed(2)}, ${resolvedLon.toFixed(2)}`;
      resolvedCountry = country || "";
    } else if (cityKey) {
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
      const err = new Error("Thiếu tham số vị trí.");
      err.statusCode = 400;
      throw err;
    }

    // 1. Kiểm tra Cache SQLite còn hạn (TTL 5m)
    const cachedData = cacheService.get(resolvedKey);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }

    // 2. Gọi Open-Meteo API
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const apiRes = await fetch(url, {
        headers: { 'User-Agent': 'WeatherApp-StudentProject/1.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      // Nếu Open-Meteo báo 429 Too Many Requests trên Cloud Render
      if (apiRes.status === 429) {
        console.warn(`[Open-Meteo Rate-limited 429] on Cloud IP. Using fallback for ${resolvedName}`);
        
        // Thử lấy dữ liệu cũ trong DB (bất kể hết hạn)
        const staleData = cacheService.get(resolvedKey, true);
        if (staleData) {
          return { data: staleData, cached: true };
        }

        // Sinh dữ liệu fallback dựa chính xác theo vùng khí hậu của vĩ độ
        const fallback = this.generateFallbackWeatherData(resolvedKey, resolvedName, resolvedCountry, resolvedLat, resolvedLon);
        cacheService.set(resolvedKey, fallback);
        cacheService.addHistory(resolvedKey, resolvedName, fallback.current.temperature, fallback.current.weatherDescription);
        return { data: fallback, cached: false };
      }

      if (!apiRes.ok) {
        throw new Error(`Open-Meteo phản hồi mã lỗi HTTP ${apiRes.status}`);
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

      // Lưu Cache SQLite
      cacheService.set(resolvedKey, normalizedData);
      cacheService.addHistory(resolvedKey, resolvedName, normalizedData.current.temperature, condition.desc);

      return { data: normalizedData, cached: false };

    } catch (networkError) {
      console.warn(`[Network/API Warning] ${resolvedName}: ${networkError.message}`);

      const staleData = cacheService.get(resolvedKey, true);
      if (staleData) {
        return { data: staleData, cached: true };
      }

      const fallback = this.generateFallbackWeatherData(resolvedKey, resolvedName, resolvedCountry, resolvedLat, resolvedLon);
      return { data: fallback, cached: false };
    }
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
