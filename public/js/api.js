/**
 * Frontend Module: API Client
 */
export async function getWeatherData({ cityKey, lat, lon, name, country }) {
  let url = '/api/weather';
  if (lat !== undefined && lon !== undefined && name) {
    url += `?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}&country=${encodeURIComponent(country || '')}`;
  } else if (cityKey) {
    url += `?city=${encodeURIComponent(cityKey)}`;
  }

  const res = await fetch(url);
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Lỗi nạp dữ liệu.");
  }
  return result.data;
}

export async function searchCitiesApi(query) {
  if (!query || query.trim().length === 0) return [];
  const res = await fetch(`/api/cities/search?q=${encodeURIComponent(query.trim())}`);
  const result = await res.json();
  return result.success ? result.data : [];
}

export async function compareCitiesData(city1, city2) {
  const res = await fetch(`/api/weather/compare?city1=${city1}&city2=${city2}`);
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Lỗi so sánh.");
  }
  return result.data;
}

export async function getSearchHistory() {
  const res = await fetch('/api/history');
  const result = await res.json();
  return result.success ? result.data : [];
}
