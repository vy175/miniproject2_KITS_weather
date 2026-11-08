/**
 * Frontend Module: API Client
 */
export async function getWeatherData(cityKey) {
  const res = await fetch(`/api/weather?city=${cityKey}`);
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || "Lỗi nạp dữ liệu.");
  }
  return result.data;
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
