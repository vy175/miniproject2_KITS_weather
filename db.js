const Database = require('better-sqlite3');
const path = require('path');

// Đường dẫn file database: weather.db
const dbPath = path.join(__dirname, 'weather.db');
const db = new Database(dbPath);

// Tối ưu hiệu năng SQLite (WAL mode)
db.pragma('journal_mode = WAL');

// Khởi tạo các bảng dữ liệu nếu chưa tồn tại
db.exec(`
  -- Bảng 1: Lưu trữ Cache thời tiết có thời hạn (Persistent Cache)
  CREATE TABLE IF NOT EXISTS weather_cache (
    city_key TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    cached_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  -- Bảng 2: Lưu trữ lịch sử tra cứu (No Auth Search History)
  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_key TEXT NOT NULL,
    city_name TEXT NOT NULL,
    temperature INTEGER NOT NULL,
    weather_desc TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Lấy dữ liệu cache còn hạn
 */
function getCache(cityKey) {
  const now = Date.now();
  const row = db.prepare(`
    SELECT data_json FROM weather_cache 
    WHERE city_key = ? AND expires_at > ?
  `).get(cityKey, now);

  if (row) {
    return JSON.parse(row.data_json);
  }
  return null;
}

/**
 * Lưu hoặc cập nhật dữ liệu cache (TTL 5 phút)
 */
function setCache(cityKey, data, ttlMs = 5 * 60 * 1000) {
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const jsonStr = JSON.stringify(data);

  const stmt = db.prepare(`
    INSERT INTO weather_cache (city_key, data_json, cached_at, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(city_key) DO UPDATE SET
      data_json = excluded.data_json,
      cached_at = excluded.cached_at,
      expires_at = excluded.expires_at
  `);

  stmt.run(cityKey, jsonStr, now, expiresAt);
}

/**
 * Ghi lại lịch sử tra cứu vào DB
 */
function addHistory(cityKey, cityName, temperature, weatherDesc) {
  const stmt = db.prepare(`
    INSERT INTO search_history (city_key, city_name, temperature, weather_desc)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(cityKey, cityName, temperature, weatherDesc);
}

/**
 * Lấy 8 lượt tra cứu gần nhất
 */
function getRecentHistory(limit = 8) {
  const rows = db.prepare(`
    SELECT city_key as cityKey, city_name as cityName, temperature, weather_desc as weatherDescription,
           strftime('%H:%M', created_at, 'localtime') as queriedAt
    FROM search_history
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);

  return rows;
}

/**
 * Thống kê cho Health Check
 */
function getStats() {
  const cacheCount = db.prepare('SELECT count(*) as count FROM weather_cache WHERE expires_at > ?').get(Date.now()).count;
  const historyCount = db.prepare('SELECT count(*) as count FROM search_history').get().count;
  return { cacheCount, historyCount };
}

module.exports = {
  getCache,
  setCache,
  addHistory,
  getRecentHistory,
  getStats,
  db
};

