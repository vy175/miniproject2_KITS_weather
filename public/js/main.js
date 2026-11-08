/**
 * Frontend Module: Main Application Controller & Event Wiring
 */
import { TRANSLATIONS } from './i18n.js';
import { getWeatherData, searchCitiesApi, compareCitiesData, getSearchHistory } from './api.js';
import { UIManager } from './ui.js';

class WeatherApp {
  constructor() {
    this.ui = new UIManager();
    this.currentLang = localStorage.getItem("preferred_lang") || "vi";
    this.isCelsius = true;
    this.currentData = null;
    this.searchTimeout = null;

    this.citySearchInput = document.getElementById("citySearchInput");
    this.clearSearchBtn = document.getElementById("clearSearchBtn");
    this.searchResultsList = document.getElementById("searchResultsList");

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

    if (!navigator.onLine) {
      this.offlineBanner.classList.remove("hidden");
    }

    // Restore last selected city or default to Hanoi
    const savedCity = localStorage.getItem("lastCityInfo");
    if (savedCity) {
      try {
        const parsed = JSON.parse(savedCity);
        this.loadWeather(parsed);
      } catch (e) {
        this.loadWeather({ cityKey: "hanoi" });
      }
    } else {
      this.loadWeather({ cityKey: "hanoi" });
    }
  }

  bindEvents() {
    // City Search Input (Autocomplete Debounce)
    this.citySearchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      this.clearSearchBtn.classList.toggle("hidden", val.length === 0);

      clearTimeout(this.searchTimeout);
      if (val.length < 2) {
        this.searchResultsList.classList.add("hidden");
        return;
      }

      this.searchTimeout = setTimeout(async () => {
        const results = await searchCitiesApi(val);
        this.renderSearchResults(results);
      }, 300);
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.citySearchInput.value = "";
      this.clearSearchBtn.classList.add("hidden");
      this.searchResultsList.classList.add("hidden");
      this.citySearchInput.focus();
    });

    // Close search dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.citySearchInput.contains(e.target) && !this.searchResultsList.contains(e.target)) {
        this.searchResultsList.classList.add("hidden");
      }
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

    this.retryBtn.addEventListener("click", () => {
      if (this.currentData) {
        this.loadWeather({ cityKey: this.currentData.city.key });
      } else {
        this.loadWeather({ cityKey: "hanoi" });
      }
    });

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
      if (this.currentData) {
        this.loadWeather({ cityKey: this.currentData.city.key });
      }
    });

    window.addEventListener("offline", () => {
      this.offlineBanner.classList.remove("hidden");
      if (window.feather) feather.replace();
    });
  }

  renderSearchResults(results) {
    if (!results || results.length === 0) {
      this.searchResultsList.innerHTML = `<div class="search-empty">${this.currentLang === 'vi' ? 'Không tìm thấy địa điểm phù hợp' : 'No locations found'}</div>`;
      this.searchResultsList.classList.remove("hidden");
      return;
    }

    this.searchResultsList.innerHTML = results.map(city => `
      <div class="search-item" data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}" data-country="${city.country}">
        <div class="search-item-info">
          <span class="search-item-name">${city.name}</span>
          <span class="search-item-sub">${city.admin1 ? city.admin1 + ', ' : ''}${city.country}</span>
        </div>
        <i data-feather="chevron-right" style="width:14px;height:14px;color:#64748b;"></i>
      </div>
    `).join("");

    this.searchResultsList.querySelectorAll(".search-item").forEach(item => {
      item.addEventListener("click", () => {
        const cityObj = {
          lat: item.getAttribute("data-lat"),
          lon: item.getAttribute("data-lon"),
          name: item.getAttribute("data-name"),
          country: item.getAttribute("data-country")
        };
        this.citySearchInput.value = `${cityObj.name}, ${cityObj.country}`;
        this.searchResultsList.classList.add("hidden");
        this.clearSearchBtn.classList.remove("hidden");

        localStorage.setItem("lastCityInfo", JSON.stringify(cityObj));
        this.loadWeather(cityObj);
      });
    });

    this.searchResultsList.classList.remove("hidden");
    if (window.feather) feather.replace();
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

    this.citySearchInput.placeholder = lang === 'vi' 
      ? "Tìm thành phố (Hà Nội, Đà Lạt, Nha Trang, Paris...)" 
      : "Search city (Tokyo, New York, London, Paris...)";

    if (this.currentData) {
      this.ui.renderWeather(this.currentData, lang, this.isCelsius);
    }
  }

  async loadWeather(params) {
    if (!navigator.onLine) {
      this.ui.showError(TRANSLATIONS[this.currentLang].offline_msg);
      return;
    }

    this.ui.setUIState("loading");
    try {
      const data = await getWeatherData(params);
      this.currentData = data;
      this.ui.renderWeather(data, this.currentLang, this.isCelsius);
      this.ui.setUIState("success");

      // Update Search field display
      if (data.city) {
        this.citySearchInput.value = `${data.city.name}${data.city.country ? ', ' + data.city.country : ''}`;
        this.clearSearchBtn.classList.remove("hidden");
      }

      const history = await getSearchHistory();
      this.ui.renderHistory(history, (cKey) => {
        this.loadWeather({ cityKey: cKey });
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
