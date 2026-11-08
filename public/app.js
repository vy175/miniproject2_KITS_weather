/**
 * Weather Dashboard - Frontend Client (Fullstack + Comparison + Smart Alerts)
 */

let currentTempCelsius = null;
let isCelsius = true;

// DOM Elements - Single View
const tabSingle = document.getElementById("tabSingle");
const tabCompare = document.getElementById("tabCompare");
const singleView = document.getElementById("singleView");
const compareView = document.getElementById("compareView");

const citySelect = document.getElementById("citySelect");
const unitToggleBtn = document.getElementById("unitToggleBtn");
const refreshBtn = document.getElementById("refreshBtn");
const testErrorBtn = document.getElementById("testErrorBtn");
const retryBtn = document.getElementById("retryBtn");

const backendStatus = document.getElementById("backendStatus");
const backendStatusText = document.getElementById("backendStatusText");
const historyList = document.getElementById("historyList");
const offlineBanner = document.getElementById("offlineBanner");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const weatherContent = document.getElementById("weatherContent");

// Alert Elements
const smartAlert = document.getElementById("smartAlert");
const smartAlertIcon = document.getElementById("smartAlertIcon");
const smartAlertTitle = document.getElementById("smartAlertTitle");
const smartAlertMessage = document.getElementById("smartAlertMessage");

const errorMessageElem = document.getElementById("errorMessage");
const temperatureElem = document.getElementById("temperature");
const unitDisplayElem = document.getElementById("unitDisplay");
const weatherDescriptionElem = document.getElementById("weatherDescription");
const updateTimeElem = document.getElementById("updateTime");
const humidityElem = document.getElementById("humidity");
const windSpeedElem = document.getElementById("windSpeed");
const coordinatesElem = document.getElementById("coordinates");
const elevationElem = document.getElementById("elevation");
const conditionIconWrap = document.getElementById("conditionIconWrap");
const cacheBadge = document.getElementById("cacheBadge");
const cacheText = document.getElementById("cacheText");

// DOM Elements - Compare View
const compareCity1 = document.getElementById("compareCity1");
const compareCity2 = document.getElementById("compareCity2");
const compareBtn = document.getElementById("compareBtn");
const compareLoading = document.getElementById("compareLoading");
const compareResult = document.getElementById("compareResult");
const compareSummaryText = document.getElementById("compareSummaryText");

const compName1 = document.getElementById("compName1");
const compTemp1 = document.getElementById("compTemp1");
const compDesc1 = document.getElementById("compDesc1");
const compHumidity1 = document.getElementById("compHumidity1");
const compWind1 = document.getElementById("compWind1");

const compName2 = document.getElementById("compName2");
const compTemp2 = document.getElementById("compTemp2");
const compDesc2 = document.getElementById("compDesc2");
const compHumidity2 = document.getElementById("compHumidity2");
const compWind2 = document.getElementById("compWind2");

const deltaTemp = document.getElementById("deltaTemp");
const deltaHumidity = document.getElementById("deltaHumidity");
const deltaWind = document.getElementById("deltaWind");

/**
 * 1. Health Check
 */
async function checkBackendHealth() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      backendStatus.className = "status-badge online";
      backendStatusText.textContent = "SQLite Server Online";
    } else {
      throw new Error();
    }
  } catch (err) {
    backendStatus.className = "status-badge offline";
    backendStatusText.textContent = "Server Offline";
  }
}

/**
 * 2. Lấy dữ liệu thời tiết đơn lẻ
 */
async function fetchWeather(cityKey, isMockError = false) {
  if (!navigator.onLine) {
    showError("Không có kết nối Internet! Vui lòng kiểm tra lại đường truyền.");
    return;
  }

  setUIState("loading");

  try {
    let url = `/api/weather?city=${cityKey}`;
    if (isMockError) url += "&mock_error=true";

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Lỗi máy chủ HTTP ${response.status}`);
    }

    renderWeatherData(result.data, result.cached);
    setUIState("success");
    loadHistory();

  } catch (err) {
    console.error("Fetch weather error:", err);
    showError(err.message || "Không thể kết nối đến Backend Server.");
  }
}

/**
 * 3. Render dữ liệu & Cảnh báo thông minh
 */
function renderWeatherData(data, isCached) {
  currentTempCelsius = data.current.temperature;
  updateTemperatureDisplay();

  weatherDescriptionElem.textContent = data.current.weatherDescription;
  conditionIconWrap.innerHTML = `<i data-feather="${data.current.weatherIcon}" class="big-icon"></i>`;

  const timeStr = data.current.time 
    ? new Date(data.current.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
    : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  updateTimeElem.textContent = `Cập nhật: ${timeStr} (${data.city.name}, ${data.city.country})`;

  humidityElem.textContent = `${data.current.humidity}%`;
  windSpeedElem.textContent = `${data.current.windSpeed} km/h`;
  coordinatesElem.textContent = `${data.city.lat.toFixed(2)}°, ${data.city.lon.toFixed(2)}°`;
  elevationElem.textContent = `${data.elevation} m`;

  // Render Smart Alert từ Rule Engine Backend
  if (data.alert) {
    smartAlert.className = `smart-alert ${data.alert.level}`;
    smartAlertIcon.innerHTML = `<i data-feather="${data.alert.icon}"></i>`;
    smartAlertTitle.textContent = data.alert.type;
    smartAlertMessage.textContent = data.alert.message;
  }

  // Render Cache Badge
  if (isCached) {
    cacheBadge.className = "cache-badge cached";
    cacheBadge.title = "Dữ liệu được nạp từ SQLite Persistent Cache (TTL 5m)";
    cacheText.textContent = "SQLITE CACHE (HIT)";
  } else {
    cacheBadge.className = "cache-badge";
    cacheBadge.title = "Dữ liệu tươi vừa fetch từ Open-Meteo và lưu vào SQLite";
    cacheText.textContent = "LIVE (MISS)";
  }

  if (window.feather) feather.replace();
}

/**
 * 4. Chuyển đổi °C / °F
 */
function updateTemperatureDisplay() {
  if (currentTempCelsius === null) return;

  if (isCelsius) {
    temperatureElem.textContent = currentTempCelsius;
    unitDisplayElem.textContent = "°C";
    unitToggleBtn.textContent = "°C";
  } else {
    const tempF = Math.round((currentTempCelsius * 9/5) + 32);
    temperatureElem.textContent = tempF;
    unitDisplayElem.textContent = "°F";
    unitToggleBtn.textContent = "°F";
  }
}

/**
 * 5. Load lịch sử từ SQLite
 */
async function loadHistory() {
  try {
    const res = await fetch("/api/history");
    const json = await res.json();

    if (json.success && json.data.length > 0) {
      historyList.innerHTML = json.data.map(item => `
        <button class="history-tag" data-city="${item.cityKey}" title="${item.weatherDescription} lúc ${item.queriedAt}">
          <strong>${item.cityName}</strong> ${item.temperature}°C
        </button>
      `).join("");

      historyList.querySelectorAll(".history-tag").forEach(tag => {
        tag.addEventListener("click", () => {
          const selectedCity = tag.getAttribute("data-city");
          citySelect.value = selectedCity;
          localStorage.setItem("lastCity", selectedCity);
          fetchWeather(selectedCity);
        });
      });
    } else {
      historyList.innerHTML = `<span class="history-empty">Chưa có lịch sử tra cứu</span>`;
    }
  } catch (err) {
    console.warn("Không thể tải lịch sử:", err);
  }
}

/**
 * 6. FEATURE MỚI: So sánh 2 thành phố song song (/api/weather/compare)
 */
async function compareCities() {
  const c1 = compareCity1.value;
  const c2 = compareCity2.value;

  if (c1 === c2) {
    alert("Vui lòng chọn 2 thành phố khác nhau để so sánh!");
    return;
  }

  compareLoading.classList.remove("hidden");
  compareResult.classList.add("hidden");

  try {
    const res = await fetch(`/api/weather/compare?city1=${c1}&city2=${c2}`);
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || "Lỗi so sánh");
    }

    const { city1, city2, delta, summary } = result.data;

    // Hiển thị Card City 1
    compName1.textContent = city1.city.name;
    compTemp1.textContent = `${city1.current.temperature}°C`;
    compDesc1.textContent = city1.current.weatherDescription;
    compHumidity1.textContent = `${city1.current.humidity}%`;
    compWind1.textContent = `${city1.current.windSpeed} km/h`;

    // Hiển thị Card City 2
    compName2.textContent = city2.city.name;
    compTemp2.textContent = `${city2.current.temperature}°C`;
    compDesc2.textContent = city2.current.weatherDescription;
    compHumidity2.textContent = `${city2.current.humidity}%`;
    compWind2.textContent = `${city2.current.windSpeed} km/h`;

    // Hiển thị Deltas
    deltaTemp.textContent = `${delta.tempDiff > 0 ? '+' : ''}${delta.tempDiff}°C`;
    deltaHumidity.textContent = `${delta.humidityDiff > 0 ? '+' : ''}${delta.humidityDiff}%`;
    deltaWind.textContent = `${delta.windDiff > 0 ? '+' : ''}${delta.windDiff} km/h`;

    // Summary Text
    compareSummaryText.textContent = summary;

    compareLoading.classList.add("hidden");
    compareResult.classList.remove("hidden");

    if (window.feather) feather.replace();

  } catch (err) {
    compareLoading.classList.add("hidden");
    alert("Lỗi khi so sánh: " + err.message);
  }
}

/**
 * UI State Helpers
 */
function setUIState(state) {
  if (state === "loading") {
    loadingState.classList.remove("hidden");
    errorState.classList.add("hidden");
    weatherContent.style.opacity = "0.3";
    weatherContent.style.pointerEvents = "none";
  } else if (state === "success") {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    weatherContent.classList.remove("hidden");
    weatherContent.style.opacity = "1";
    weatherContent.style.pointerEvents = "auto";
  } else if (state === "error") {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    weatherContent.classList.add("hidden");
  }
}

function showError(msg) {
  errorMessageElem.textContent = msg;
  setUIState("error");
  if (window.feather) feather.replace();
}

// Tab Switching
tabSingle.addEventListener("click", () => {
  tabSingle.classList.add("active");
  tabCompare.classList.remove("active");
  singleView.classList.remove("hidden");
  compareView.classList.add("hidden");
});

tabCompare.addEventListener("click", () => {
  tabCompare.classList.add("active");
  tabSingle.classList.remove("active");
  compareView.classList.remove("hidden");
  singleView.classList.add("hidden");
  if (window.feather) feather.replace();
});

// Event Listeners
citySelect.addEventListener("change", (e) => {
  localStorage.setItem("lastCity", e.target.value);
  fetchWeather(e.target.value);
});

unitToggleBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  updateTemperatureDisplay();
});

refreshBtn.addEventListener("click", () => fetchWeather(citySelect.value));
retryBtn.addEventListener("click", () => fetchWeather(citySelect.value));
testErrorBtn.addEventListener("click", () => fetchWeather(citySelect.value, true));
compareBtn.addEventListener("click", compareCities);

window.addEventListener("online", () => {
  offlineBanner.classList.add("hidden");
  checkBackendHealth();
  fetchWeather(citySelect.value);
});

window.addEventListener("offline", () => {
  offlineBanner.classList.remove("hidden");
  if (window.feather) feather.replace();
});

document.addEventListener("DOMContentLoaded", () => {
  if (window.feather) feather.replace();

  if (!navigator.onLine) {
    offlineBanner.classList.remove("hidden");
  }

  const savedCity = localStorage.getItem("lastCity");
  if (savedCity && citySelect.querySelector(`option[value="${savedCity}"]`)) {
    citySelect.value = savedCity;
  }

  checkBackendHealth();
  fetchWeather(citySelect.value);
});
