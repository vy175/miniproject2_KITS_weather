const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const weatherService = require('../../src/services/weatherService');

describe('Unit Test: WeatherService (Comparison & Validation)', () => {
  test('Nên ném lỗi 400 nếu thiếu thành phố khi so sánh', async () => {
    await assert.rejects(
      async () => await weatherService.compareCities('hanoi', ''),
      (err) => err.statusCode === 400 && err.message.includes('đủ 2 thành phố')
    );
  });

  test('Nên ném lỗi 400 nếu so sánh 2 thành phố trùng nhau', async () => {
    await assert.rejects(
      async () => await weatherService.compareCities('hanoi', 'hanoi'),
      (err) => err.statusCode === 400 && err.message.includes('khác nhau')
    );
  });

  test('Nên tính toán chính xác Delta và phân tích so sánh 2 thành phố', async () => {
    const result = await weatherService.compareCities('hanoi', 'tokyo');

    assert.ok(result.city1, 'Phải có dữ liệu thành phố 1');
    assert.ok(result.city2, 'Phải có dữ liệu thành phố 2');
    assert.ok(result.delta, 'Phải có object delta');

    const expectedTempDiff = result.city1.current.temperature - result.city2.current.temperature;
    assert.strictEqual(result.delta.tempDiff, expectedTempDiff, 'Độ lệch nhiệt độ tính toán phải chính xác');

    const expectedHumidityDiff = result.city1.current.humidity - result.city2.current.humidity;
    assert.strictEqual(result.delta.humidityDiff, expectedHumidityDiff, 'Độ lệch độ ẩm tính toán phải chính xác');

    assert.ok(typeof result.summary === 'string' && result.summary.length > 0, 'Phải sinh câu nhận định so sánh');
  });
});

