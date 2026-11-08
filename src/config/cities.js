/**
 * Configuration: Supported cities & coordinates
 */
const CITIES = {
  hanoi: { name: "Hà Nội", lat: 21.0285, lon: 105.8542, country: "Việt Nam" },
  danang: { name: "Đà Nẵng", lat: 16.0544, lon: 108.2022, country: "Việt Nam" },
  hcm: { name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297, country: "Việt Nam" },
  tokyo: { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Nhật Bản" },
  seoul: { name: "Seoul", lat: 37.5665, lon: 126.9780, country: "Hàn Quốc" },
  london: { name: "London", lat: 51.5074, lon: -0.1278, country: "Vương quốc Anh" },
  paris: { name: "Paris", lat: 48.8566, lon: 2.3522, country: "Pháp" },
  newyork: { name: "New York", lat: 40.7128, lon: -74.0060, country: "Mỹ" },
  sydney: { name: "Sydney", lat: -33.8688, lon: 151.2093, country: "Úc" }
};

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
  82: { desc: "Mưa rào dữ dội", icon: "cloud-lightning" },
  95: { desc: "Dông sét nhẹ đến vừa", icon: "cloud-lightning" },
  96: { desc: "Dông bão kèm mưa đá", icon: "cloud-lightning" },
  99: { desc: "Dông bão kèm mưa đá to", icon: "cloud-lightning" }
};

module.exports = {
  CITIES,
  WMO_CODES,
  CACHE_TTL_MS: 5 * 60 * 1000 // 5 minutes
};
