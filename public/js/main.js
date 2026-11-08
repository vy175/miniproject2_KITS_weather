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
    this.compareSearchTimeout1 = null;
    this.compareSearchTimeout2 = null;

    // Single Search Elements
    this.citySearchInput = document.getElementById("citySearchInput");
    this.clearSearchBtn = document.getElementById("clearSearchBtn");
    this.searchResultsList = document.getElementById("searchResultsList");

    // Compare Search Elements
    this.compareSearch1 = document.getElementById("compareSearch1");
    this.compareResults1 = document.getElementById("compareResults1");
    this.compareSearch2 = document.getElementById("compareSearch2");
    this.compareResults2 = document.getElementById("compareResults2");
    this.compareBtn = document.getElementById("compareBtn");

    // City 1 & 2 selected payload
    this.selectedCity1 = { cityKey: "hanoi", name: "Hà Nội", country: "Việt Nam" };
    this.selectedCity2 = { cityKey: "tokyo", name: "Tokyo", country: "Nhật Bản" };

    this.unitToggleBtn = document.getElementById("unitToggleBtn");
    this.langToggleBtn = document.getElementById("langToggleBtn");
    this.retryBtn = document.getElementById("retryBtn");

    this.tabSingle = document.getElementById("tabSingle");
    this.tabCompare = document.getElementById("tabCompare");
    this.singleView = document.getElementById("singleView");
    this.compareView = document.getElementById("compareView");
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
    // 1. Single City Search Input (Autocomplete)
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
        this.renderSearchResults(results, this.searchResultsList, (cityObj) => {
          this.citySearchInput.value = `${cityObj.name}, ${cityObj.country}`;
          this.searchResultsList.classList.add("hidden");
          this.clearSearchBtn.classList.remove("hidden");
          localStorage.setItem("lastCityInfo", JSON.stringify(cityObj));
          this.loadWeather(cityObj);
        });
      }, 300);
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.citySearchInput.value = "";
      this.clearSearchBtn.classList.add("hidden");
      this.searchResultsList.classList.add("hidden");
      this.citySearchInput.focus();
    });

    // 2. Compare City 1 Search Input (Autocomplete)
    this.compareSearch1.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      clearTimeout(this.compareSearchTimeout1);
      if (val.length < 2) {
        this.compareResults1.classList.add("hidden");
        return;
      }
      this.compareSearchTimeout1 = setTimeout(async () => {
        const results = await searchCitiesApi(val);
        this.renderSearchResults(results, this.compareResults1, (cityObj) => {
          this.compareSearch1.value = `${cityObj.name}, ${cityObj.country}`;
          this.compareSearch1.setAttribute("data-key", cityObj.cityKey || `${Number(cityObj.lat).toFixed(2)}_${Number(cityObj.lon).toFixed(2)}`);
          this.selectedCity1 = cityObj;
          this.compareResults1.classList.add("hidden");
        });
      }, 300);
    });

    // 3. Compare City 2 Search Input (Autocomplete)
    this.compareSearch2.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      clearTimeout(this.compareSearchTimeout2);
      if (val.length < 2) {
        this.compareResults2.classList.add("hidden");
        return;
      }
      this.compareSearchTimeout2 = setTimeout(async () => {
        const results = await searchCitiesApi(val);
        this.renderSearchResults(results, this.compareResults2, (cityObj) => {
          this.compareSearch2.value = `${cityObj.name}, ${cityObj.country}`;
          this.compareSearch2.setAttribute("data-key", cityObj.cityKey || `${Number(cityObj.lat).toFixed(2)}_${Number(cityObj.lon).toFixed(2)}`);
          this.selectedCity2 = cityObj;
          this.compareResults2.classList.add("hidden");
        });
      }, 300);
    });

    // Close any search dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.citySearchInput.contains(e.target) && !this.searchResultsList.contains(e.target)) {
        this.searchResultsList.classList.add("hidden");
      }
      if (!this.compareSearch1.contains(e.target) && !this.compareResults1.contains(e.target)) {
        this.compareResults1.classList.add("hidden");
      }
      if (!this.compareSearch2.contains(e.target) && !this.compareResults2.contains(e.target)) {
        this.compareResults2.classList.add("hidden");
      }
    });

    // Unit toggle
    this.unitToggleBtn.addEventListener("click", () => {
      this.isCelsius = !this.isCelsius;
      this.unitToggleBtn.querySelector(".unit-c").classList.toggle("active", this.isCelsius);
      this.unitToggleBtn.querySelector(".unit-f").classList.toggle("active", !this.isCelsius);
      if (this.currentData) {
        this.ui.renderWeather(this.currentData, this.currentLang, this.isCelsius);
      }
    });

    // Language toggle
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

    // Tabs
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

  renderSearchResults(results, container, onSelect) {
    if (!results || results.length === 0) {
      container.innerHTML = `<div class="search-empty">${this.currentLang === 'vi' ? 'Không tìm thấy địa điểm phù hợp' : 'No locations found'}</div>`;
      container.classList.remove("hidden");
      return;
    }

    container.innerHTML = results.map(city => `
      <div class="search-item" data-lat="${city.lat}" data-lon="${city.lon}" data-name="${city.name}" data-country="${city.country}">
        <div class="search-item-info">
          <span class="search-item-name">${city.name}</span>
          <span class="search-item-sub">${city.admin1 ? city.admin1 + ', ' : ''}${city.country}</span>
        </div>
        <i data-feather="chevron-right" style="width:14px;height:14px;color:#64748b;"></i>
      </div>
    `).join("");

    container.querySelectorAll(".search-item").forEach(item => {
      item.addEventListener("click", () => {
        const cityObj = {
          lat: item.getAttribute("data-lat"),
          lon: item.getAttribute("data-lon"),
          name: item.getAttribute("data-name"),
          country: item.getAttribute("data-country")
        };
        onSelect(cityObj);
      });
    });

    container.classList.remove("hidden");
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

    this.compareSearch1.placeholder = lang === 'vi' ? "Tìm thành phố 1..." : "Search city 1...";
    this.compareSearch2.placeholder = lang === 'vi' ? "Tìm thành phố 2..." : "Search city 2...";

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
    const key1 = this.compareSearch1.getAttribute("data-key") || this.compareSearch1.value.trim();
    const key2 = this.compareSearch2.getAttribute("data-key") || this.compareSearch2.value.trim();

    if (!key1 || !key2) {
      alert(this.currentLang === 'vi' ? "Vui lòng chọn đủ 2 thành phố để so sánh." : "Please select both cities to compare.");
      return;
    }

    if (key1 === key2) {
      alert(this.currentLang === 'vi' ? "Vui lòng chọn 2 thành phố khác nhau để so sánh." : "Please choose two different cities.");
      return;
    }

    this.ui.compareLoading.classList.remove("hidden");
    this.ui.compareResult.classList.add("hidden");

    try {
      const result = await compareCitiesData(key1, key2);
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
