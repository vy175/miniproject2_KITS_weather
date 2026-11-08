const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const cacheService = require('../../src/services/cacheService');

describe('Unit Test: CacheService (SQLite Persistence & Operations)', () => {
  const testKey = 'test_city_unit_test';
  const testData = {
    city: { name: 'Thành phố Test', lat: 10, lon: 100 },
    current: { temperature: 25, humidity: 70 }
  };

  test('Nên lưu và đọc thành công dữ liệu từ Cache SQLite', () => {
    cacheService.set(testKey, testData, 60000); // TTL 1 phút
    const retrieved = cacheService.get(testKey);

    assert.ok(retrieved, 'Dữ liệu cache phải tồn tại');
    assert.strictEqual(retrieved.city.name, 'Thành phố Test');
    assert.strictEqual(retrieved.current.temperature, 25);
  });

  test('Nên trả về null nếu Cache đã hết hạn (TTL Expired)', () => {
    const expiredKey = 'expired_city_test';
    // Đặt TTL = -1000 ms (đã hết hạn trong quá khứ)
    cacheService.set(expiredKey, testData, -1000);
    const retrieved = cacheService.get(expiredKey);

    assert.strictEqual(retrieved, null, 'Cache hết hạn phải trả về null');
  });

  test('Nên thêm và xóa thành công lịch sử tra cứu', () => {
    const historyKey = 'history_city_unit_test';
    cacheService.addHistory(historyKey, 'Thành phố Lịch sử', 22, 'Trời quang');

    let history = cacheService.getRecentHistory(20);
    const item = history.find(h => h.cityKey === historyKey);
    assert.ok(item, 'Mục lịch sử vừa thêm phải có trong danh sách');
    assert.strictEqual(item.cityName, 'Thành phố Lịch sử');

    // Test Xóa mục này
    const deleted = cacheService.deleteHistory(historyKey);
    assert.strictEqual(deleted, true, 'Hàm xóa phải trả về true');

    history = cacheService.getRecentHistory(20);
    const notFound = history.find(h => h.cityKey === historyKey);
    assert.strictEqual(notFound, undefined, 'Mục lịch sử đã bị xóa khỏi DB');
  });
});
