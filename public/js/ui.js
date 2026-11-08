/**
 * Frontend Module: UI Component Renderer
 */
import { TRANSLATIONS, WMO_DESC } from './i18n.js';

export class UIManager {
  constructor() {
    this.cityNameElem = document.getElementById("cityName");
    this.countryNameElem = document.getElementById("countryName");
    this.updateTimeElem = document.getElementById("updateTime");
    this.temperatureElem = document.getElementById("temperature");
    this.unitDisplayElem = document.getElementById("unitDisplay");
    this.weatherDescriptionElem = document.getElementById("weatherDescription");
    this.conditionIconWrap = document.getElementById("conditionIconWrap");

    this.smartAlert = document.getElementById("smartAlert");
    this.alertIcon = document.getElementById("alertIcon");
    this.alertMessage = document.getElementById("alertMessage");

    this.humidityElem = document.getElementById("humidity");
    this.windSpeedElem = document.getElementById("windSpeed");
    this.elevationElem = document.getElementById("elevation");
    this.coordinatesElem = document.getElementById("coordinates");

    this.loadingState = document.getElementById("loadingState");
    this.errorState = document.getElementById("errorState");
    this.errorMessageElem = document.getElementById("errorMessage");
    this.weatherContent = document.getElementById("weatherContent");
    this.historyList = document.getElementById("historyList");

    // Compare Elements
    this.compName1 = document.getElementById("compName1");
    this.compTemp1 = document.getElementById("compTemp1");
    this.compDesc1 = document.getElementById("compDesc1");
    this.compHumidity1 = document.getElementById("compHumidity1");
    this.compWind1 = document.getElementById("compWind1");

    this.compName2 = document.getElementById("compName2");
    this.compTemp2 = document.getElementById("compTemp2");
    this.compDesc2 = document.getElementById("compDesc2");
    this.compHumidity2 = document.getElementById("compHumidity2");
    this.compWind2 = document.getElementById("compWind2");

    this.deltaTemp = document.getElementById("deltaTemp");
    this.deltaHumidity = document.getElementById("deltaHumidity");
    this.deltaWind = document.getElementById("deltaWind");
    this.compareSummaryText = document.getElementById("compareSummaryText");
    this.compareLoading = document.getElementById("compareLoading");
    this.compareResult = document.getElementById("compareResult");
  }

  setUIState(state) {
    if (state === "loading") {
      this.loadingState.classList.remove("hidden");
      this.errorState.classList.add("hidden");
      this.weatherContent.style.opacity = "0.3";
      this.weatherContent.style.pointerEvents = "none";
    } else if (state === "success") {
      this.loadingState.classList.add("hidden");
      this.errorState.classList.add("hidden");
      this.weatherContent.classList.remove("hidden");
      this.weatherContent.style.opacity = "1";
      this.weatherContent.style.pointerEvents = "auto";
    } else if (state === "error") {
      this.loadingState.classList.add("hidden");
      this.errorState.classList.remove("hidden");
      this.weatherContent.classList.add("hidden");
    }
  }

  showError(msg) {
    this.errorMessageElem.textContent = msg;
    this.setUIState("error");
    if (window.feather) feather.replace();
  }

  renderWeather(data, lang, isCelsius) {
    const temp = isCelsius ? data.current.temperature : Math.round((data.current.temperature * 9/5) + 32);
    this.temperatureElem.textContent = temp;
    this.unitDisplayElem.textContent = isCelsius ? "°C" : "°F";

    this.cityNameElem.textContent = data.city.name;
    this.countryNameElem.textContent = data.city.country;

    const code = data.current.weatherCode;
    const condition = WMO_DESC[code];
    this.weatherDescriptionElem.textContent = condition ? condition[lang] : data.current.weatherDescription;

    this.conditionIconWrap.innerHTML = `<i data-feather="${data.current.weatherIcon}"></i>`;

    const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
    const timeStr = data.current.time 
      ? new Date(data.current.time).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) 
      : new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    this.updateTimeElem.textContent = `${TRANSLATIONS[lang].today_label}, ${timeStr}`;

    this.humidityElem.textContent = `${data.current.humidity}%`;
    this.windSpeedElem.textContent = `${data.current.windSpeed} km/h`;
    this.elevationElem.textContent = `${data.elevation} m`;
    this.coordinatesElem.textContent = `${data.city.lat.toFixed(1)}°, ${data.city.lon.toFixed(1)}°`;

    if (data.alert) {
      this.smartAlert.className = `advice-card ${data.alert.level}`;
      this.alertIcon.setAttribute("data-feather", data.alert.icon || "info");
      this.alertMessage.textContent = lang === 'en' 
        ? (TRANSLATIONS.en.alert_fallbacks[data.alert.level] || data.alert.message) 
        : data.alert.message;
    }

    if (window.feather) feather.replace();
  }

  renderHistory(historyList, onSelectCity, onDeleteCity) {
    if (!historyList || historyList.length === 0) {
      this.historyList.innerHTML = "";
      return;
    }

    this.historyList.innerHTML = historyList.slice(0, 6).map(item => `
      <div class="quick-chip-wrap">
        <button class="quick-chip" data-city="${item.cityKey}">
          ${item.cityName} · ${item.temperature}°
        </button>
        <button class="chip-delete-btn" data-delete-key="${item.cityKey}" title="Xóa khỏi lịch sử">
          <i data-feather="x"></i>
        </button>
      </div>
    `).join("");

    this.historyList.querySelectorAll(".quick-chip").forEach(chip => {
      chip.addEventListener("click", () => onSelectCity(chip.getAttribute("data-city")));
    });

    this.historyList.querySelectorAll(".chip-delete-btn").forEach(delBtn => {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cityKey = delBtn.getAttribute("data-delete-key");
        onDeleteCity(cityKey);
      });
    });

    if (window.feather) feather.replace();
  }

  renderCompare(result, lang) {
    const { city1, city2, delta, summary } = result;

    this.compName1.textContent = city1.city.name;
    this.compTemp1.textContent = `${city1.current.temperature}°`;
    const code1 = city1.current.weatherCode;
    this.compDesc1.textContent = WMO_DESC[code1] ? WMO_DESC[code1][lang] : city1.current.weatherDescription;
    this.compHumidity1.textContent = `${city1.current.humidity}%`;
    this.compWind1.textContent = `${city1.current.windSpeed} km/h`;

    this.compName2.textContent = city2.city.name;
    this.compTemp2.textContent = `${city2.current.temperature}°`;
    const code2 = city2.current.weatherCode;
    this.compDesc2.textContent = WMO_DESC[code2] ? WMO_DESC[code2][lang] : city2.current.weatherDescription;
    this.compHumidity2.textContent = `${city2.current.humidity}%`;
    this.compWind2.textContent = `${city2.current.windSpeed} km/h`;

    this.deltaTemp.textContent = `${delta.tempDiff > 0 ? '+' : ''}${delta.tempDiff}°`;
    this.deltaHumidity.textContent = `${delta.humidityDiff > 0 ? '+' : ''}${delta.humidityDiff}%`;
    this.deltaWind.textContent = `${delta.windDiff > 0 ? '+' : ''}${delta.windDiff} km/h`;

    if (lang === 'en') {
      let enSummary = `${city1.city.name} is ${delta.tempDiff > 0 ? 'warmer' : 'cooler'} than ${city2.city.name} by ${Math.abs(delta.tempDiff)}°C. `;
      if (Math.abs(delta.humidityDiff) > 15) {
        enSummary += `${delta.humidityDiff > 0 ? city1.city.name : city2.city.name} is significantly more humid.`;
      }
      this.compareSummaryText.textContent = enSummary;
    } else {
      this.compareSummaryText.textContent = summary;
    }

    this.compareLoading.classList.add("hidden");
    this.compareResult.classList.remove("hidden");

    if (window.feather) feather.replace();
  }
}
