const weatherService = require('../services/weatherService');
const cacheService = require('../services/cacheService');
const { CITIES } = require('../config/cities');

/**
 * Controller: Handles incoming HTTP requests and responses
 */
class WeatherController {
  async getWeather(req, res) {
    const { city, lat, lon, name, country, mock_error } = req.query;

    if (mock_error === 'true') {
      return res.status(500).json({
        success: false,
        error: "Mô phỏng lỗi máy chủ (500 Internal Server Error) phục vụ kiểm thử hệ thống."
      });
    }

    if (!city && (!lat || !lon)) {
      return res.status(400).json({
        success: false,
        error: "Thiếu tham số 'city' hoặc tọa độ ('lat', 'lon'). Ví dụ: /api/weather?city=hanoi"
      });
    }

    try {
      const result = await weatherService.getWeather({ cityKey: city, lat, lon, name, country });
      res.setHeader('X-Cache', result.cached ? 'HIT' : 'MISS');
      return res.json({
        success: true,
        cached: result.cached,
        data: result.data
      });
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message
      });
    }
  }

  async searchCities(req, res) {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    try {
      const results = await weatherService.searchCities(q);
      return res.json({ success: true, data: results });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async compareWeather(req, res) {
    const { city1, city2 } = req.query;

    try {
      const result = await weatherService.compareCities(city1, city2);
      return res.json({
        success: true,
        data: result
      });
    } catch (err) {
      const status = err.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: err.message
      });
    }
  }

  getHistory(req, res) {
    const history = cacheService.getRecentHistory(8);
    return res.json({
      success: true,
      data: history
    });
  }

  getCities(req, res) {
    const list = Object.entries(CITIES).map(([key, data]) => ({
      key,
      name: data.name,
      country: data.country
    }));
    return res.json({ success: true, data: list });
  }

  getHealth(req, res) {
    const stats = cacheService.getStats();
    return res.json({
      status: 'OK',
      uptime: Math.round(process.uptime()) + ' seconds',
      database: 'SQLite (weather.db)',
      cachedItemsInDb: stats.cacheCount,
      historyTotalInDb: stats.historyCount,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new WeatherController();
