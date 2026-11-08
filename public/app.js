/**
 * Clean & Modern Weather App Client Logic
 * Features: Multi-language (VI / EN), Unit Toggle (°C / °F), Comparison, SQLite History
 */

// I18N Translations Dictionary
const TRANSLATIONS = {
  vi: {
    app_title: "Thời Tiết",
    tab_current: "Hiện tại",
    tab_compare: "So sánh",
    offline_msg: "Thiết bị đang ngoại tuyến. Vui lòng kiểm tra lại kết nối.",
    loading_text: "Đang cập nhật...",
    error_title: "Không thể tải thời tiết",
    error_msg: "Vui lòng kiểm tra kết nối mạng và thử lại.",
    btn_retry: "Thử lại",
    metric_humidity: "Độ ẩm",
    metric_humidity_sub: "Độ ẩm tương đối",
    metric_wind: "Tốc độ gió",
    metric_wind_sub: "Sức gió hiện tại",
    metric_elevation: "Độ cao",
    metric_elevation_sub: "So với mực nước biển",
    metric_coords: "Tọa độ",
    metric_coords_sub: "Vĩ độ, Kinh độ",
    compare_title: "So sánh thời tiết 2 thành phố",
    compare_subtitle: "Đối chiếu sự khác biệt về nhiệt độ, độ ẩm và các chỉ số thời tiết.",
    city_1_label: "Thành phố 1",
    city_2_label: "Thành phố 2",
    city_1_badge: "Thành phố 1",
    city_2_badge: "Thành phố 2",
    btn_compare: "So sánh",
    compare_loading: "Đang tải dữ liệu so sánh...",
    diff_temp: "Chênh lệch nhiệt độ",
    diff_humidity: "Chênh lệch độ ẩm",
    diff_wind: "Chênh lệch sức gió",
    footer_text: "Dữ liệu khí tượng Open-Meteo",
    today_label: "Hôm nay",
    alert_fallbacks: {
      "danger": "Dông sét bão nguy hiểm! Hạn chế ra ngoài.",
      "warning": "Nhiệt độ ngoài trời rất cao, hãy uống đủ nước.",
      "info": "Thời tiết lạnh sâu, chú ý giữ ấm cơ thể.",
      "success": "Thời tiết thuận lợi cho các hoạt động ngoài trời."
    }
  },
  en: {
    app_title: "Weather",
    tab_current: "Current",
    tab_compare: "Compare",
    offline_msg: "You are currently offline. Please check your internet connection.",
    loading_text: "Updating weather...",
    error_title: "Unable to load weather",
    error_msg: "Please check your network connection and try again.",
    btn_retry: "Retry",
    metric_humidity: "Humidity",
    metric_humidity_sub: "Relative humidity",
    metric_wind: "Wind Speed",
    metric_wind_sub: "Current wind force",
    metric_elevation: "Elevation",
    metric_elevation_sub: "Above sea level",
    metric_coords: "Coordinates",
    metric_coords_sub: "Latitude, Longitude",
    compare_title: "Compare 2 Cities",
    compare_subtitle: "Compare differences in temperature, humidity, and weather conditions.",
    city_1_label: "City 1",
    city_2_label: "City 2",
    city_1_badge: "City 1",
    city_2_badge: "City 2",
    btn_compare: "Compare Weather",
    compare_loading: "Comparing cities...",
    diff_temp: "Temperature Difference",
    diff_humidity: "Humidity Difference",
    diff_wind: "Wind Speed Difference",
    footer_text: "Meteorological data by Open-Meteo",
    today_label: "Today",
    alert_fallbacks: {
      "danger": "Severe thunderstorm or storm! Stay indoors if possible.",
      "warning": "High temperature alert, stay hydrated.",
      "info": "Cold weather, remember to wear warm clothes.",
      "success": "Pleasant weather for outdoor activities."
    }
  }
};

// Weather Code Translations (WMO)
const WMO_DESC = {
  0: { vi: "Trời quang đãng (Nắng)", en: "Clear sky" },
  1: { vi: "Phần lớn trời quang", en: "Mainly clear" },
  2: { vi: "Mây rải rác", en: "Partly cloudy" },
  3: { vi: "Trời u ám nhiều mây", en: "Overcast" },
  45: { vi: "Sương mù", en: "Fog" },
  48: { vi: "Sương mù đóng băng", en: "Depositing rime fog" },
  51: { vi: "Mưa phùn nhẹ", en: "Light drizzle" },
  53: { vi: "Mưa phùn vừa", en: "Moderate drizzle" },
  55: { vi: "Mưa phùn dày", en: "Dense drizzle" },
  61: { vi: "Mưa nhỏ", en: "Slight rain" },
  63: { vi: "Mưa vừa", en: "Moderate rain" },
  65: { vi: "Mưa to", en: "Heavy rain" },
  71: { vi: "Tuyết rơi nhẹ", en: "Slight snow" },
  73: { vi: "Tuyết rơi vừa", en: "Moderate snow" },
  75: { vi: "Tuyết rơi dày", en: "Heavy snow" },
  80: { vi: "Mưa rào nhẹ", en: "Slight rain showers" },
  81: { vi: "Mưa rào vừa", en: "Moderate rain showers" },
  82: { vi: "Mưa rào dữ dội", en: "Violent rain showers" },
  95: { vi: "Dông sét nhẹ đến vừa", en: "Thunderstorm" },
  96: { vi: "Dông kèm mưa đá nhỏ", en: "Thunderstorm with slight hail" },
  99: { vi: "Dông bão kèm mưa đá to", en: "Thunderstorm with heavy hail" }
};

// State
let currentLang = localStorage.getItem("preferred_lang") || "vi";
let currentTempCelsius = null;
let isCelsius = true;
let lastWeatherData = null;

// DOM Elements
const langToggleBtn = document.getElementById("langToggleBtn");
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
 * 1. Switch & Apply Language
 */
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("preferred_lang", lang);

  // Update Button state
  const langVi = langToggleBtn.querySelector(".lang-vi");
  const langEn = langToggleBtn.querySelector(".lang-en");
  if (lang === "vi") {
    langVi.classList.add("active");
    langEn.classList.remove("active");
  } else {
    langEn.classList.add("active");
    langVi.classList.remove("active");
  }

  // Update static UI texts
  const dict = TRANSLATIONS[lang];
  document.querySelectorAll("[data-i18n]").forEach(elem => {
    const key = elem.getAttribute("data-i18n");
    if (dict[key]) {
      elem.textContent = dict[key];
    }
  });

  // Re-render weather if data exists
  if (lastWeatherData) {
    renderWeather(lastWeatherData);
  }
}

/**
 * 2. Fetch Single Weather Data
 */
async function fetchWeather(cityKey) {
  if (!navigator.onLine) {
    showError(TRANSLATIONS[currentLang].offline_msg);
    return;
  }

  setUIState("loading");

  try {
    const response = await fetch(`/api/weather?city=${cityKey}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || TRANSLATIONS[currentLang].error_msg);
    }

    lastWeatherData = result.data;
    renderWeather(result.data);
    setUIState("success");
    loadHistory();

  } catch (err) {
    showError(err.message || TRANSLATIONS[currentLang].error_msg);
  }
}

/**
 * 3. Render Single Weather View
 */
function renderWeather(data) {
  currentTempCelsius = data.current.temperature;
  updateTemperature();

  cityNameElem.textContent = data.city.name;
  countryNameElem.textContent = data.city.country;

  // Localized weather condition description
  const code = data.current.weatherCode;
  const conditionObj = WMO_DESC[code];
  const desc = conditionObj ? conditionObj[currentLang] : data.current.weatherDescription;
  weatherDescriptionElem.textContent = desc;

  conditionIconWrap.innerHTML = `<i data-feather="${data.current.weatherIcon}"></i>`;

  const timeStr = data.current.time 
    ? new Date(data.current.time).toLocaleTimeString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) 
    : new Date().toLocaleTimeString(currentLang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  
  updateTimeElem.textContent = `${TRANSLATIONS[currentLang].today_label}, ${timeStr}`;

  humidityElem.textContent = `${data.current.humidity}%`;
  windSpeedElem.textContent = `${data.current.windSpeed} km/h`;
  elevationElem.textContent = `${data.elevation} m`;
  coordinatesElem.textContent = `${data.city.lat.toFixed(1)}°, ${data.city.lon.toFixed(1)}°`;

  // Localized Alert
  if (data.alert) {
    smartAlert.className = `advice-card ${data.alert.level}`;
    alertIcon.setAttribute("data-feather", data.alert.icon || "info");
    
    // Choose translation or fallback
    if (currentLang === 'en') {
      alertMessage.textContent = TRANSLATIONS.en.alert_fallbacks[data.alert.level] || data.alert.message;
    } else {
      alertMessage.textContent = data.alert.message;
    }
  }

  if (window.feather) feather.replace();
}

/**
 * 4. Temperature Unit Toggle
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
 * 5. Load History Chips
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
 * 6. Compare 2 Cities
 */
async function handleCompare() {
  const c1 = compareCity1.value;
  const c2 = compareCity2.value;

  if (c1 === c2) {
    alert(currentLang === 'vi' ? "Vui lòng chọn hai thành phố khác nhau để so sánh." : "Please select two different cities to compare.");
    return;
  }

  compareLoading.classList.remove("hidden");
  compareResult.classList.add("hidden");

  try {
    const res = await fetch(`/api/weather/compare?city1=${c1}&city2=${c2}`);
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || "Error comparing cities.");
    }

    const { city1, city2, delta, summary } = result.data;

    compName1.textContent = city1.city.name;
    compTemp1.textContent = `${city1.current.temperature}°`;
    const code1 = city1.current.weatherCode;
    compDesc1.textContent = WMO_DESC[code1] ? WMO_DESC[code1][currentLang] : city1.current.weatherDescription;
    compHumidity1.textContent = `${city1.current.humidity}%`;
    compWind1.textContent = `${city1.current.windSpeed} km/h`;

    compName2.textContent = city2.city.name;
    compTemp2.textContent = `${city2.current.temperature}°`;
    const code2 = city2.current.weatherCode;
    compDesc2.textContent = WMO_DESC[code2] ? WMO_DESC[code2][currentLang] : city2.current.weatherDescription;
    compHumidity2.textContent = `${city2.current.humidity}%`;
    compWind2.textContent = `${city2.current.windSpeed} km/h`;

    deltaTemp.textContent = `${delta.tempDiff > 0 ? '+' : ''}${delta.tempDiff}°`;
    deltaHumidity.textContent = `${delta.humidityDiff > 0 ? '+' : ''}${delta.humidityDiff}%`;
    deltaWind.textContent = `${delta.windDiff > 0 ? '+' : ''}${delta.windDiff} km/h`;

    // Localize comparison summary
    if (currentLang === 'en') {
      let enSummary = "";
      if (delta.tempDiff > 0) {
        enSummary = `${city1.city.name} is currently warmer than ${city2.city.name} by ${Math.abs(delta.tempDiff)}°C. `;
      } else if (delta.tempDiff < 0) {
        enSummary = `${city1.city.name} is currently cooler than ${city2.city.name} by ${Math.abs(delta.tempDiff)}°C. `;
      } else {
        enSummary = `Both cities share the same temperature (${city1.current.temperature}°C). `;
      }
      if (delta.humidityDiff > 15) {
        enSummary += `${city1.city.name} is significantly more humid (+${delta.humidityDiff}%).`;
      } else if (delta.humidityDiff < -15) {
        enSummary += `${city2.city.name} is significantly more humid (+${Math.abs(delta.humidityDiff)}%).`;
      }
      compareSummaryText.textContent = enSummary;
    } else {
      compareSummaryText.textContent = summary;
    }

    compareLoading.classList.add("hidden");
    compareResult.classList.remove("hidden");

    if (window.feather) feather.replace();

  } catch (err) {
    compareLoading.classList.add("hidden");
    alert((currentLang === 'vi' ? "Lỗi: " : "Error: ") + err.message);
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
langToggleBtn.addEventListener("click", () => {
  const nextLang = currentLang === "vi" ? "en" : "vi";
  applyLanguage(nextLang);
});

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

  // Restore preferred language
  applyLanguage(currentLang);

  const savedCity = localStorage.getItem("lastCity");
  if (savedCity && citySelect.querySelector(`option[value="${savedCity}"]`)) {
    citySelect.value = savedCity;
  }

  fetchWeather(citySelect.value);
});
