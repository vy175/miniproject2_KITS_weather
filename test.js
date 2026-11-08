/**
 * Automated Test Suite for Weather Backend
 * Run: node test.js
 */

const BASE_URL = 'http://localhost:3000';

const tests = [
  {
    name: 'TC-01: Health Check Endpoint (/api/health)',
    url: `${BASE_URL}/api/health`,
    expectedStatus: 200,
    validate: (res) => res.status === 'OK' && res.database.includes('SQLite')
  },
  {
    name: 'TC-02: Get Cities List (/api/cities)',
    url: `${BASE_URL}/api/cities`,
    expectedStatus: 200,
    validate: (res) => res.success === true && Array.isArray(res.data) && res.data.length > 0
  },
  {
    name: 'TC-03: Fetch Weather for Hanoi (Live / Proxy & Smart Alert)',
    url: `${BASE_URL}/api/weather?city=hanoi`,
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data.city.name === 'Hà Nội' && res.data.alert !== undefined
  },
  {
    name: 'TC-04: Test SQLite Cache (X-Cache: HIT)',
    url: `${BASE_URL}/api/weather?city=hanoi`,
    expectedStatus: 200,
    validate: (res, headers) => res.cached === true || headers.get('X-Cache') === 'HIT'
  },
  {
    name: 'TC-05: Compare 2 Cities (/api/weather/compare?city1=hanoi&city2=tokyo)',
    url: `${BASE_URL}/api/weather/compare?city1=hanoi&city2=tokyo`,
    expectedStatus: 200,
    validate: (res) => res.success === true && res.data.delta.tempDiff !== undefined && res.data.summary.length > 0
  },
  {
    name: 'TC-06: Compare Same City Error (400 Bad Request)',
    url: `${BASE_URL}/api/weather/compare?city1=hanoi&city2=hanoi`,
    expectedStatus: 400,
    validate: (res) => res.success === false
  },
  {
    name: 'TC-07: Missing City Parameter (400 Bad Request)',
    url: `${BASE_URL}/api/weather`,
    expectedStatus: 400,
    validate: (res) => res.success === false && typeof res.error === 'string'
  },
  {
    name: 'TC-08: Mock Internal Server Error (500 Error Test)',
    url: `${BASE_URL}/api/weather?city=hanoi&mock_error=true`,
    expectedStatus: 500,
    validate: (res) => res.success === false && res.error.includes('Mô phỏng lỗi')
  },
  {
    name: 'TC-09: Check SQLite Search History (No Auth)',
    url: `${BASE_URL}/api/history`,
    expectedStatus: 200,
    validate: (res) => res.success === true && Array.isArray(res.data) && res.data.length > 0
  }
];

async function runTests() {
  console.log('==================================================');
  console.log('🧪 BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS)');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      const isStatusMatch = response.status === test.expectedStatus;
      const data = await response.json();
      const isValid = test.validate(data, response.headers);

      if (isStatusMatch && isValid) {
        console.log(`✅ [PASS] ${test.name}`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${test.name}`);
        console.error(`   Status: Expected ${test.expectedStatus}, got ${response.status}`);
        console.error(`   Response:`, JSON.stringify(data));
        failed++;
      }
    } catch (err) {
      console.error(`💥 [ERROR] ${test.name}: ${err.message}`);
      failed++;
    }
  }

  console.log('\n==================================================');
  console.log(`📊 KẾT QUẢ: ${passed}/${tests.length} tests thành công!`);
  if (failed === 0) {
    console.log('🎉 TẤT CẢ TEST CASES ĐỀU ĐẠT CHUẨN!');
  } else {
    console.log(`⚠️ Có ${failed} test bị lỗi.`);
  }
  console.log('==================================================');
}

runTests();
