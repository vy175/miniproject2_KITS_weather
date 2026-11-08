const db = require('../database/connection');
const { CACHE_TTL_MS } = require('../config/cities');

/**
 * Service: Persistent Cache via SQLite (Supports Stale-While-Revalidate)
 */
class CacheService {
  get(cityKey, ignoreExpiry = false) {
    const now = Date.now();
    let query = `SELECT data_json FROM weather_cache WHERE city_key = ?`;
    if (!ignoreExpiry) {
      query += ` AND expires_at > ${now}`;
    }

    const row = db.prepare(query).get(cityKey);
    return row ? JSON.parse(row.data_json) : null;
  }

  set(cityKey, data, ttlMs = CACHE_TTL_MS) {
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

  addHistory(cityKey, cityName, temperature, weatherDesc) {
    db.prepare(`DELETE FROM search_history WHERE city_key = ?`).run(cityKey);

    const stmt = db.prepare(`
      INSERT INTO search_history (city_key, city_name, temperature, weather_desc)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(cityKey, cityName, temperature, weatherDesc);

    // Keep max 20 latest
    db.prepare(`
      DELETE FROM search_history 
      WHERE id NOT IN (
        SELECT id FROM search_history ORDER BY id DESC LIMIT 20
      )
    `).run();
  }

  deleteHistory(cityKey) {
    const stmt = db.prepare(`DELETE FROM search_history WHERE city_key = ?`);
    const result = stmt.run(cityKey);
    return result.changes > 0;
  }

  clearAllHistory() {
    db.prepare(`DELETE FROM search_history`).run();
    return true;
  }

  getRecentHistory(limit = 12) {
    return db.prepare(`
      SELECT city_key as cityKey, city_name as cityName, temperature, weather_desc as weatherDescription,
             strftime('%H:%M', created_at, 'localtime') as queriedAt
      FROM search_history
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);
  }

  getStats() {
    const cacheCount = db.prepare('SELECT count(*) as count FROM weather_cache WHERE expires_at > ?').get(Date.now()).count;
    const historyCount = db.prepare('SELECT count(*) as count FROM search_history').get().count;
    return { cacheCount, historyCount };
  }
}

module.exports = new CacheService();
