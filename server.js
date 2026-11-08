const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Danh sách tọa độ các thành phố hỗ trợ
const CITIES = {
  hanoi: { name: "Hà Nội", lat: 21.0285, lon: 105.8542, country: "Việt Nam" },
  danang: { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022, country: "Việt Nam" },
  hcm: { name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297, country: "Việt Nam" },
  tokyo: { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Nhật Bản" },
  seoul: { name: "Seoul", lat: 37.5665, lon: 126.9780, country: "Hàn Quốc" },
  london: { name: "London", lat: 51.5074, lon: -0.1278, country: "Vương quốc Anh" },
  paris: { name: "Paris", lat: 48.8566, lon: 2.3522, country: "Pháp" },
  newyork: { name: "New York", lat: 40.7128, lon: -74.0060, country: "Mỹ" },
  sydney: { name: "Sydney", lat: -33.8688, lon: 151.2093, country: "Úc" }
};

// Bảng tra mã WMO
const WMO_CODES = {
  0: { desc: "Trời quang đãng (Nắng)", icon: "sun" },
  1: { desc: "Phần lớn trời quang", icon: "sun" },
  2: { desc: "Mây rải rác", icon: "cloud" },
  3: { desc: "Trời u ám nhiều mây", icon: "cloud" },
  45: { desc: "Sương mù", icon: "cloud" },
  48: { desc: "Sương mù đóng băng", icon: "cloud" },
  51: { desc: "Mưa phùn nhẹ", icon: "cloud-drizzle" },
  53: { desc: "Mưa phùn vừa", icon: "cloud-drizzle" },
  55: { desc: "Mưa phùn dày đặc", icon: "cloud-drizzle" },
  61: { desc: "Mưa nhỏ", icon: "cloud-rain" },
  63: { desc: "Mưa vừa", icon: "cloud-rain" },
  65: { desc: "Mưa rào to", icon: "cloud-rain" },
  71: { desc: "Tuyết rơi nhẹ", icon: "cloud-snow" },
  73: { desc: "Tuyết rơi vừa", icon: "cloud-snow" },
  75: { desc: "Tuyết rơi dày", icon: "cloud-snow" },
  80: { desc: "Mưa rào nhẹ rải rác", icon: "cloud-rain" },
  81: { desc: "Mưa rào vừa", icon: "cloud-rain" },
  82: { desc: "Mưa rào dữ dội", icon: "cloud-lightning" },
  95: { desc: "Dông sét nhẹ đến vừa", icon: "cloud-lightning" },
  96: { desc: "Dông bão kèm mưa đá", icon: "cloud-lightning" },
  99: { desc: "Dông bão kèm mưa đá to", icon: "cloud-lightning" }
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

/**
 * Rule Engine: Sinh cảnh báo thời tiết thông minh & lời khuyên sức khỏe
 */
function generateWeatherAlert(current) {
  const { temperature, windSpeed, weatherCode, humidity } = current;

  // Cảnh báo dông sét bão
  if ([82, 95, 96, 99].includes(weatherCode)) {
    return {
      level: "danger",
      type: "Dông bão & Sét nguy hiểm",
      message: "Có dông sét nguy hiểm hoặc mưa đá! Nên hạn chế ra ngoài, tránh trú mưa dưới gốc cây to hoặc cột điện.",
      icon: "alert-octagon"
    };
  }

  // Cảnh báo mưa to
  if ([63, 65, 80, 81].includes(weatherCode)) {
    return {
      level: "warning",
      type: "Mưa to diện rộng",
      message: "Đang có mưa vừa đến mưa to. Đừng quên mang áo mưa hoặc ô và chú ý trơn trượt khi lái xe.",
      icon: "cloud-rain"
    };
  }

  // Cảnh báo nhiệt độ cao (Nắng nóng)
  if (temperature >= 35) {
    return {
      level: "warning",
      type: "Nắng nóng gay gắt",
      message: "Nhiệt độ ngoài trời rất cao! Uống nhiều nước, bôi kem chống nắng và hạn chế ở ngoài trời lâu giữa trưa.",
      icon: "sun"
    };
  }

  // Cảnh báo nhiệt độ rét lạnh
  if (temperature <= 10) {
    return {
      level: "info",
      type: "Trời rét đậm",
      message: "Thời tiết lạnh sâu. Hãy mặc ấm, giữ ấm cổ và đeo găng tay khi ra đường.",
      icon: "thermometer"
    };
  }

  // Cảnh báo gió lớn
  if (windSpeed >= 25) {
    return {
      level: "warning",
      type: "Gió giật mạnh",
      message: `Tốc độ gió đạt ${windSpeed} km/h. Chú ý gió giật mạnh ở các khu vực thoáng và kiểm tra cửa sổ ban công.`,
      icon: "wind"
    };
  }

  // Thời tiết lý tưởng
  return {
    level: "success",
    type: "Thời tiết dễ chịu",
    message: "Thời tiết hiện tại rất thuận lợi cho các hoạt động làm việc, học tập và thể thao ngoài trời.",
    icon: "check-circle"
  };
}

/**
 * Hàm dùng chung: Lấy dữ liệu thời tiết của 1 thành phố (Tự động tra cứu Cache SQLite trước)
 */
async function getCityWeather(cityKey) {
  const cityInfo = CITIES[cityKey.toLowerCase()];
  if (!cityInfo) {
    throw new Error(`Thành phố '${cityKey}' không tồn tại.`);
  }

  const cachedData = db.getCache(cityKey.toLowerCase());
  if (cachedData) {
    return { data: cachedData, cached: true };
  }

  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  const apiRes = await fetch(openMeteoUrl, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!apiRes.ok) {
    throw new Error(`Open-Meteo trả về mã lỗi HTTP ${apiRes.status}`);
  }

  const rawData = await apiRes.json();
  const current = rawData.current;

  const weatherCondition = WMO_CODES[current.weather_code] || {
    desc: "Không xác định",
    icon: "help-circle"
  };

  const currentMetrics = {
    temperature: Math.round(current.temperature_2m),
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
    weatherDescription: weatherCondition.desc,
    weatherIcon: weatherCondition.icon,
    time: current.time
  };

  const alert = generateWeatherAlert(currentMetrics);

  const normalizedData = {
    city: {
      key: cityKey.toLowerCase(),
      name: cityInfo.name,
      country: cityInfo.country,
      lat: cityInfo.lat,
      lon: cityInfo.lon
    },
    current: currentMetrics,
    alert,
    elevation: rawData.elevation ?? 0,
    updatedAt: new Date().toISOString()
  };

  // Lưu vào SQLite
  db.setCache(cityKey.toLowerCase(), normalizedData, CACHE_TTL_MS);
  db.addHistory(cityKey.toLowerCase(), cityInfo.name, normalizedData.current.temperature, weatherCondition.desc);

  return { data: normalizedData, cached: false };
}

/**
 * 1. Health Check
 */
app.get('/api/health', (req, res) => {
  const stats = db.getStats();
  res.json({
    status: 'OK',
    uptime: Math.round(process.uptime()) + ' seconds',
    database: 'SQLite (weather.db)',
    cachedItemsInDb: stats.cacheCount,
    historyTotalInDb: stats.historyCount,
    timestamp: new Date().toISOString()
  });
});

/**
 * 2. Lấy danh sách thành phố
 */
app.get('/api/cities', (req, res) => {
  const cityList = Object.entries(CITIES).map(([key, data]) => ({
    key,
    name: data.name,
    country: data.country
  }));
  res.json({ success: true, data: cityList });
});

/**
 * 3. Lấy lịch sử tra cứu (No Auth)
 */
app.get('/api/history', (req, res) => {
  const history = db.getRecentHistory(8);
  res.json({ success: true, data: history });
});

/**
 * 4. API Thời tiết đơn thành phố
 * GET /api/weather?city=hanoi
 */
app.get('/api/weather', async (req, res) => {
  const { city, mock_error } = req.query;

  if (mock_error === 'true') {
    return res.status(500).json({
      success: false,
      error: "Mô phỏng lỗi máy chủ (500 Internal Server Error) phục vụ kiểm thử hệ thống."
    });
  }

  if (!city) {
    return res.status(400).json({ success: false, error: "Thiếu tham số 'city'." });
  }

  try {
    const result = await getCityWeather(city);
    res.setHeader('X-Cache', result.cached ? 'HIT' : 'MISS');
    return res.json({ success: true, cached: result.cached, data: result.data });
  } catch (error) {
    console.error(`[Weather API Error] ${city}:`, error.message);
    if (error.name === 'AbortError') {
      return res.status(504).json({ success: false, error: "Quá thời gian kết nối tới Open-Meteo (Timeout 7s)." });
    }
    return res.status(502).json({ success: false, error: error.message });
  }
});

/**
 * 5. FEATURE NÂNG CAO: So sánh thời tiết giữa 2 thành phố
 * GET /api/weather/compare?city1=hanoi&city2=tokyo
 */
app.get('/api/weather/compare', async (req, res) => {
  const { city1, city2 } = req.query;

  if (!city1 || !city2) {
    return res.status(400).json({
      success: false,
      error: "Yêu cầu cung cấp đủ 2 thành phố để so sánh. Ví dụ: /api/weather/compare?city1=hanoi&city2=tokyo"
    });
  }

  if (city1.toLowerCase() === city2.toLowerCase()) {
    return res.status(400).json({
      success: false,
      error: "Vui lòng chọn 2 thành phố khác nhau để so sánh."
    });
  }

  try {
    // Gọi song song 2 thành phố bằng Promise.all
    const [res1, res2] = await Promise.all([
      getCityWeather(city1),
      getCityWeather(city2)
    ]);

    const c1 = res1.data;
    const c2 = res2.data;

    // Phân tích độ lệch (Delta Analysis)
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

    return res.json({
      success: true,
      data: {
        city1: c1,
        city2: c2,
        delta: {
          tempDiff,
          humidityDiff,
          windDiff
        },
        summary: comparisonSummary
      }
    });

  } catch (error) {
    console.error("[Compare Error]:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Weather Backend Server is running!`);
  console.log(`🗄️ Database:       SQLite (weather.db)`);
  console.log(`📍 Web Dashboard:  http://localhost:${PORT}`);
  console.log(`📍 Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`📍 Compare API:    http://localhost:${PORT}/api/weather/compare?city1=hanoi&city2=tokyo`);
  console.log(`===============================================`);
});
