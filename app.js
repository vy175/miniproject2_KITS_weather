/**
 * Weather Dashboard - Open-Meteo Integration
 */

// Danh sách tọa độ các thành phố hỗ trợ
const CITIES = {
  hanoi: { name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
  danang: { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  hcm: { name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297 },
  tokyo: { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  seoul: { name: "Seoul", lat: 37.5665, lon: 126.9780 },
  london: { name: "London", lat: 51.5074, lon: -0.1278 },
  paris: { name: "Paris", lat: 48.8566, lon: 2.3522 },
  newyork: { name: "New York", lat: 40.7128, lon: -74.0060 },
  sydney: { name: "Sydney", lat: -33.8688, lon: 151.2093 }
};

// Bảng tra WMO Weather interpretation codes (WW)
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
  82: { desc: "Mưa rào rất dữ dội", icon: "cloud-lightning" },
  95: { desc: "Dông sét nhẹ đến vừa", icon: "cloud-lightning" },
  96: { desc: "Dông bão kèm mưa đá nhỏ", icon: "cloud-lightning" },
  99: { desc: "Dông bão kèm mưa đá to", icon: "cloud-lightning" }
};

// DOM Elements
const citySelect = document.getElementById("citySelect");
const refreshBtn = document.getElementById("refreshBtn");
const testErrorBtn = document.getElementById("testErrorBtn");
const retryBtn = document.getElementById("retryBtn");

const offlineBanner = document.getElementById("offlineBanner");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const weatherContent = document.getElementById("weatherContent");

const errorMessageElem = document.getElementById("errorMessage");
const temperatureElem = document.getElementById("temperature");
const weatherDescriptionElem = document.getElementById("weatherDescription");
const updateTimeElem = document.getElementById("updateTime");
const humidityElem = document.getElementById("humidity");
const windSpeedElem = document.getElementById("windSpeed");
const coordinatesElem = document.getElementById("coordinates");
const elevationElem = document.getElementById("elevation");
const conditionIconWrap = document.getElementById("conditionIconWrap");

// Biến cờ giả lập lỗi (dùng cho test case UI Error)
let forceSimulateError = false;

/**
 * Hiển thị trạng thái giao diện
 * @param {'loading' | 'success' | 'error'} state 
 */
function setUIState(state) {
  if (state === 'loading') {
    loadingState.classList.remove("hidden");
    errorState.classList.add("hidden");
    weatherContent.style.opacity = "0.3";
    weatherContent.style.pointerEvents = "none";
  } else if (state === 'success') {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    weatherContent.classList.remove("hidden");
    weatherContent.style.opacity = "1";
    weatherContent.style.pointerEvents = "auto";
  } else if (state === 'error') {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    weatherContent.classList.add("hidden");
  }
}

/**
 * Lấy dữ liệu thời tiết từ Open-Meteo API
 */
async function fetchWeatherData() {
  const selectedCityKey = citySelect.value;
  const city = CITIES[selectedCityKey];

  if (!city) {
    showError("Không tìm thấy thông tin thành phố đã chọn!");
    return;
  }

  // 1. Kiểm tra trạng thái mạng trước khi gọi
  if (!navigator.onLine) {
    showError("Không có kết nối Internet! Vui lòng kiểm tra lại Wi-Fi hoặc mạng di động.");
    return;
  }

  setUIState('loading');

  try {
    // URL API thật
    let apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

    // Nếu người dùng bấm Test Lỗi API
    if (forceSimulateError) {
      apiUrl = `https://api.open-meteo.com/v1/forecast-invalid-url-simulation-error-test`;
      forceSimulateError = false; // Reset sau 1 lần test
    }

    // Thiết lập timeout 8 giây đề phòng mạng lag
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Lỗi máy chủ HTTP ${response.status}: ${response.statusText || "Yêu cầu thất bại"}`);
    }

    const data = await response.json();
    renderWeather(data, city);
    setUIState('success');

  } catch (error) {
    console.error("Weather API Error:", error);
    let userMsg = "Đã xảy ra lỗi khi lấy dữ liệu thời tiết.";

    if (error.name === "AbortError") {
      userMsg = "Quá thời gian kết nối (Timeout 8s). Đường truyền mạng quá chậm hoặc máy chủ phản hồi lâu.";
    } else if (!navigator.onLine) {
      userMsg = "Mất kết nối Internet trong lúc gửi yêu cầu.";
    } else if (error.message) {
      userMsg = error.message;
    }

    showError(userMsg);
  }
}

/**
 * Hiển thị dữ liệu lên giao diện
 */
function renderWeather(data, city) {
  const current = data.current;
  if (!current) {
    showError("Định dạng dữ liệu trả về từ API không hợp lệ.");
    return;
  }

  // Cập nhật nhiệt độ
  temperatureElem.textContent = Math.round(current.temperature_2m);

  // Cập nhật chỉ số thời tiết từ weather_code
  const weatherInfo = WMO_CODES[current.weather_code] || { desc: "Thời tiết không xác định", icon: "help-circle" };
  weatherDescriptionElem.textContent = weatherInfo.desc;

  // Cập nhật icon động
  conditionIconWrap.innerHTML = `<i data-feather="${weatherInfo.icon}" class="big-icon"></i>`;

  // Cập nhật thời gian
  const timeStr = current.time ? new Date(current.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN');
  updateTimeElem.textContent = `Cập nhật lúc: ${timeStr} (${city.name})`;

  // Các chỉ số phụ
  humidityElem.textContent = `${current.relative_humidity_2m}%`;
  windSpeedElem.textContent = `${current.wind_speed_10m} km/h`;
  coordinatesElem.textContent = `${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°`;
  elevationElem.textContent = `${data.elevation ?? 0} m`;

  // Render lại Feather Icons cho các icon mới tạo
  if (window.feather) {
    feather.replace();
  }
}

/**
 * Xử lý báo lỗi
 */
function showError(message) {
  errorMessageElem.textContent = message;
  setUIState('error');
  if (window.feather) {
    feather.replace();
  }
}

// Bắt sự kiện mạng Online/Offline
window.addEventListener("online", () => {
  offlineBanner.classList.add("hidden");
  // Tự động tải lại dữ liệu khi có mạng trở lại
  fetchWeatherData();
});

window.addEventListener("offline", () => {
  offlineBanner.classList.remove("hidden");
  if (window.feather) feather.replace();
});

// Event Listeners
citySelect.addEventListener("change", fetchWeatherData);
refreshBtn.addEventListener("click", fetchWeatherData);
retryBtn.addEventListener("click", fetchWeatherData);

// Nút test lỗi API chủ động
testErrorBtn.addEventListener("click", () => {
  forceSimulateError = true;
  fetchWeatherData();
});

// Khởi chạy khi tải trang xong
document.addEventListener("DOMContentLoaded", () => {
  if (window.feather) {
    feather.replace();
  }

  // Kiểm tra trạng thái mạng ban đầu
  if (!navigator.onLine) {
    offlineBanner.classList.remove("hidden");
  }

  fetchWeatherData();
});

