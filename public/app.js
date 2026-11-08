/**
 * Clean & Modern Weather App Client Logic
 */

let currentTempCelsius = null;
let isCelsius = true;

// DOM Elements
const tabSingle = document.getElementById("tabSingle");
const tabCompare = document.getElementById("tabCompare");
const singleView = document.getElementById("singleView");
const compareView = document.getElementById("compareView");

const citySelect = document.getElementById("citySelect");
const unitToggleBtn = document.getElementById("unitToggleBtn");
const historyList = document.getElementById("historyList");
const offlineBanner = document.getElementById("offlineBanner");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const weatherContent = document.getElementById("weatherContent");
const retryBtn = document.getElementById("retryBtn");

const cityNameElem = document.getElementById("cityName");
const countryNameElem = document.getElementById("countryName");
const updateTimeElem = document.getElementById("updateTime");
const temperatureElem = document.getElementById("temperature");
const unitDisplayElem = document.getElementById("unitDisplay");
const weatherDescriptionElem = document.getElementById("weatherDescription");
const conditionIconWrap = document.getElementById("conditionIconWrap");

const smartAlert = document.getElementById("smartAlert");
const alertIcon = document.getElementById("alertIcon");
const alertMessage = document.getElementById("alertMessage");

const humidityElem = document.getElementById("humidity");
const windSpeedElem = document.getElementById("windSpeed");
const elevationElem = document.getElementById("elevation");
const coordinatesElem = document.getElementById("coordinates");

// Compare Elements
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
 * 1. Fetch Single Weather Data
 */
async function fetchWeather(cityKey) {
  if (!navigator.onLine) {
    showError("Thiết bị đang mất kết nối Internet. Vui lòng kiểm tra lại mạng.");
    return;
  }

  setUIState("loading");

  try {
    const response = await fetch(`/api/weather?city=${cityKey}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Không thể tải dữ liệu thời tiết lúc này.");
    }

    renderWeather(result.data);
    setUIState("success");
    loadHistory();

  } catch (err) {
    showError(err.message || "Đã xảy ra sự cố trong quá trình kết nối.");
  }
}

/**
 * 2. Render Single Weather View
 */
function renderWeather(data) {
  currentTempCelsius = data.current.temperature;
  updateTemperature();

  cityNameElem.textContent = data.city.name;
  countryNameElem.textContent = data.city.country;
  weatherDescriptionElem.textContent = data.current.weatherDescription;
  conditionIconWrap.innerHTML = `<i data-feather="${data.current.weatherIcon}"></i>`;

  const timeStr = data.current.time 
    ? new Date(data.current.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
    : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  updateTimeElem.textContent = `Hôm nay, ${timeStr}`;

  humidityElem.textContent = `${data.current.humidity}%`;
  windSpeedElem.textContent = `${data.current.windSpeed} km/h`;
  elevationElem.textContent = `${data.elevation} m`;
  coordinatesElem.textContent = `${data.city.lat.toFixed(1)}°, ${data.city.lon.toFixed(1)}°`;

  // Advisory Pill
  if (data.alert) {
    smartAlert.className = `advisory-pill ${data.alert.level}`;
    alertIcon.setAttribute("data-feather", data.alert.icon || "info");
    alertMessage.textContent = data.alert.message;
  }

  if (window.feather) feather.replace();
}

/**
 * 3. Temperature Unit Toggle
 */
function updateTemperature() {
  if (currentTempCelsius === null) return;

  const unitC = unitToggleBtn.querySelector(".unit-c");
  const unitF = unitToggleBtn.querySelector(".unit-f");

  if (isCelsius) {
    temperatureElem.textContent = currentTempCelsius;
    unitDisplayElem.textContent = "°C";
    unitC.classList.add("active");
    unitF.classList.remove("active");
  } else {
    const tempF = Math.round((currentTempCelsius * 9/5) + 32);
    temperatureElem.textContent = tempF;
    unitDisplayElem.textContent = "°F";
    unitF.classList.add("active");
    unitC.classList.remove("active");
  }
}

/**
 * 4. Load History Chips
 */
async function loadHistory() {
  try {
    const res = await fetch("/api/history");
    const json = await res.json();

    if (json.success && json.data.length > 0) {
      historyList.innerHTML = json.data.slice(0, 5).map(item => `
        <button class="quick-chip" data-city="${item.cityKey}">
          ${item.cityName} · ${item.temperature}°
        </button>
      `).join("");

      historyList.querySelectorAll(".quick-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          const selectedCity = chip.getAttribute("data-city");
          citySelect.value = selectedCity;
          localStorage.setItem("lastCity", selectedCity);
          fetchWeather(selectedCity);
        });
      });
    } else {
      historyList.innerHTML = "";
    }
  } catch (err) {
    console.warn("History load skipped");
  }
}

/**
 * 5. Compare 2 Cities
 */
async function handleCompare() {
  const c1 = compareCity1.value;
  const c2 = compareCity2.value;

  if (c1 === c2) {
    alert("Vui lòng chọn hai thành phố khác nhau để so sánh.");
    return;
  }

  compareLoading.classList.remove("hidden");
  compareResult.classList.add("hidden");

  try {
    const res = await fetch(`/api/weather/compare?city1=${c1}&city2=${c2}`);
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || "Không thể thực hiện so sánh.");
    }

    const { city1, city2, delta, summary } = result.data;

    compName1.textContent = city1.city.name;
    compTemp1.textContent = `${city1.current.temperature}°`;
    compDesc1.textContent = city1.current.weatherDescription;
    compHumidity1.textContent = `${city1.current.humidity}%`;
    compWind1.textContent = `${city1.current.windSpeed} km/h`;

    compName2.textContent = city2.city.name;
    compTemp2.textContent = `${city2.current.temperature}°`;
    compDesc2.textContent = city2.current.weatherDescription;
    compHumidity2.textContent = `${city2.current.humidity}%`;
    compWind2.textContent = `${city2.current.windSpeed} km/h`;

    deltaTemp.textContent = `${delta.tempDiff > 0 ? '+' : ''}${delta.tempDiff}°`;
    deltaHumidity.textContent = `${delta.humidityDiff > 0 ? '+' : ''}${delta.humidityDiff}%`;
    deltaWind.textContent = `${delta.windDiff > 0 ? '+' : ''}${delta.windDiff} km/h`;

    compareSummaryText.textContent = summary;

    compareLoading.classList.add("hidden");
    compareResult.classList.remove("hidden");

    if (window.feather) feather.replace();

  } catch (err) {
    compareLoading.classList.add("hidden");
    alert("Không thể so sánh: " + err.message);
  }
}

/**
 * UI State Controllers
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
  document.getElementById("errorMessage").textContent = msg;
  setUIState("error");
  if (window.feather) feather.replace();
}

// Navigation Tabs
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
  updateTemperature();
});

retryBtn.addEventListener("click", () => {
  fetchWeather(citySelect.value);
});

compareBtn.addEventListener("click", handleCompare);

window.addEventListener("online", () => {
  offlineBanner.classList.add("hidden");
  fetchWeather(citySelect.value);
});

window.addEventListener("offline", () => {
  offlineBanner.classList.remove("hidden");
  if (window.feather) feather.replace();
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (window.feather) feather.replace();

  if (!navigator.onLine) {
    offlineBanner.classList.remove("hidden");
  }

  const savedCity = localStorage.getItem("lastCity");
  if (savedCity && citySelect.querySelector(`option[value="${savedCity}"]`)) {
    citySelect.value = savedCity;
  }

  fetchWeather(citySelect.value);
});
