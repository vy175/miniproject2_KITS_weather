const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const alertService = require('../../src/services/alertService');

describe('Unit Test: AlertService (Rule-based Weather Advisory)', () => {
  test('Nên cảnh báo nguy hiểm (danger) khi có dông bão/mưa đá (WMO 95, 96, 99)', () => {
    const alert = alertService.analyze({
      temperature: 28,
      windSpeed: 10,
      weatherCode: 95,
      humidity: 80
    });
    assert.strictEqual(alert.level, 'danger');
    assert.strictEqual(alert.icon, 'alert-octagon');
    assert.match(alert.message, /dông sét/i);
  });

  test('Nên cảnh báo nắng nóng (warning) khi nhiệt độ >= 35°C', () => {
    const alert = alertService.analyze({
      temperature: 37,
      windSpeed: 8,
      weatherCode: 0,
      humidity: 50
    });
    assert.strictEqual(alert.level, 'warning');
    assert.strictEqual(alert.icon, 'sun');
    assert.match(alert.type, /nắng nóng/i);
  });

  test('Nên cảnh báo trời rét (info) khi nhiệt độ <= 10°C', () => {
    const alert = alertService.analyze({
      temperature: 8,
      windSpeed: 5,
      weatherCode: 1,
      humidity: 60
    });
    assert.strictEqual(alert.level, 'info');
    assert.strictEqual(alert.icon, 'thermometer');
    assert.match(alert.type, /rét/i);
  });

  test('Nên cảnh báo gió giật mạnh (warning) khi tốc độ gió >= 25 km/h', () => {
    const alert = alertService.analyze({
      temperature: 25,
      windSpeed: 30,
      weatherCode: 2,
      humidity: 70
    });
    assert.strictEqual(alert.level, 'warning');
    assert.strictEqual(alert.icon, 'wind');
    assert.match(alert.type, /gió/i);
  });

  test('Nên báo thời tiết thuận lợi (success) khi các chỉ số đều ở mức an toàn', () => {
    const alert = alertService.analyze({
      temperature: 24,
      windSpeed: 12,
      weatherCode: 1,
      humidity: 65
    });
    assert.strictEqual(alert.level, 'success');
    assert.strictEqual(alert.icon, 'check-circle');
    assert.match(alert.type, /dễ chịu/i);
  });
});
