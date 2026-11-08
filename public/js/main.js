/**
 * Frontend Module: Main Application Controller & Event Wiring
 */
import { TRANSLATIONS } from './i18n.js';
import { getWeatherData, compareCitiesData, getSearchHistory } from './api.js';
import { UIManager } from './ui.js';

class WeatherApp {
  constructor() {
    this.ui = new UIManager();
    this.currentLang = localStorage.getItem("preferred_lang") || "vi";
    this.isCelsius = true;
    this.currentData = null;

    this.citySelect = document.getElementById("citySelect");
    this.unitToggleBtn = document.getElementById("unitToggleBtn");
    this.langToggleBtn = document.getElementById("langToggleBtn");
    this.retryBtn = document.getElementById("retryBtn");
    this.compareBtn = document.getElementById("compareBtn");

    this.tabSingle = document.getElementById("tabSingle");
    this.tabCompare = document.getElementById("tabCompare");
    this.singleView = document.getElementById("singleView");
    this.compareView = document.getElementById("compareView");

    this.compareCity1 = document.getElementById("compareCity1");
    this.compareCity2 = document.getElementById("compareCity2");
    this.offlineBanner = document.getElementById("offlineBanner");

    this.init();
  }

  init() {
    if (window.feather) feather.replace();

    this.applyLanguage(this.currentLang);
    this.bindEvents();

    const savedCity = localStorage.getItem("lastCity");
    if (savedCity && this.citySelect.querySelector(`option[value="${savedCity}"]`)) {
      this.citySelect.value = savedCity;
    }

    if (!navigator.onLine) {
      this.offlineBanner.classList.remove("hidden");
    }

    this.loadWeather(this.citySelect.value);
  }

  bindEvents() {
    this.citySelect.addEventListener("change", (e) => {
      localStorage.setItem("lastCity", e.target.value);
      this.loadWeather(e.target.value);
    });

    this.unitToggleBtn.addEventListener("click", () => {
      this.isCelsius = !this.isCelsius;
      this.unitToggleBtn.querySelector(".unit-c").classList.toggle("active", this.isCelsius);
      this.unitToggleBtn.querySelector(".unit-f").classList.toggle("active", !this.isCelsius);
      if (this.currentData) {
        this.ui.renderWeather(this.currentData, this.currentLang, this.isCelsius);
      }
    });

    this.langToggleBtn.addEventListener("click", () => {
      const next = this.currentLang === "vi" ? "en" : "vi";
      this.applyLanguage(next);
    });

    this.retryBtn.addEventListener("click", () => this.loadWeather(this.citySelect.value));
    this.compareBtn.addEventListener("click", () => this.handleCompare());

    this.tabSingle.addEventListener("click", () => {
      this.tabSingle.classList.add("active");
      this.tabCompare.classList.remove("active");
      this.singleView.classList.remove("hidden");
      this.compareView.classList.add("hidden");
    });

    this.tabCompare.addEventListener("click", () => {
      this.tabCompare.classList.add("active");
      this.tabSingle.classList.remove("active");
      this.compareView.classList.remove("hidden");
      this.singleView.classList.add("hidden");
      if (window.feather) feather.replace();
    });

    window.addEventListener("online", () => {
      this.offlineBanner.classList.add("hidden");
      this.loadWeather(this.citySelect.value);
    });

    window.addEventListener("offline", () => {
      this.offlineBanner.classList.remove("hidden");
      if (window.feather) feather.replace();
    });
  }

  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem("preferred_lang", lang);

    this.langToggleBtn.querySelector(".lang-vi").classList.toggle("active", lang === "vi");
    this.langToggleBtn.querySelector(".lang-en").classList.toggle("active", lang === "en");

    const dict = TRANSLATIONS[lang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (dict[k]) el.textContent = dict[k];
    });

    if (this.currentData) {
      this.ui.renderWeather(this.currentData, lang, this.isCelsius);
    }
  }

  async loadWeather(cityKey) {
    if (!navigator.onLine) {
      this.ui.showError(TRANSLATIONS[this.currentLang].offline_msg);
      return;
    }

    this.ui.setUIState("loading");
    try {
      const data = await getWeatherData(cityKey);
      this.currentData = data;
      this.ui.renderWeather(data, this.currentLang, this.isCelsius);
      this.ui.setUIState("success");

      const history = await getSearchHistory();
      this.ui.renderHistory(history, (c) => {
        this.citySelect.value = c;
        localStorage.setItem("lastCity", c);
        this.loadWeather(c);
      });
    } catch (err) {
      this.ui.showError(err.message);
    }
  }

  async handleCompare() {
    const c1 = this.compareCity1.value;
    const c2 = this.compareCity2.value;

    if (c1 === c2) {
      alert(this.currentLang === 'vi' ? "Vui lòng chọn 2 thành phố khác nhau để so sánh." : "Please choose two different cities.");
      return;
    }

    this.ui.compareLoading.classList.remove("hidden");
    this.ui.compareResult.classList.add("hidden");

    try {
      const result = await compareCitiesData(c1, c2);
      this.ui.renderCompare(result, this.currentLang);
    } catch (err) {
      this.ui.compareLoading.classList.add("hidden");
      alert(err.message);
    }
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  new WeatherApp();
});
