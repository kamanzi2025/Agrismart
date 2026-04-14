// ─── Shared types (also used by PlantingPage) ────────────────────────────────

export interface DayForecast {
  date: string;
  dayName: string;
  tempHigh: number;
  rainfall: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'heavy rain';
  icon: string;
}

export interface WeatherForecast {
  location: string;
  days: DayForecast[];
  /** Weekly average high temperature °C */
  avgTemp: number;
  /** Weekly average daily rainfall mm */
  avgRainfall: number;
  /** Weekly average humidity % */
  avgHumidity: number;
  /** ISO timestamp of when data was fetched from the API */
  fetchedAt: string;
}

// ─── localStorage keys ───────────────────────────────────────────────────────

export const LS_WEATHER  = 'agrismart_weather';
export const LS_LOCATION = 'agrismart_location';

// ─── API call ─────────────────────────────────────────────────────────────────

const WEATHER_BASE =
  (import.meta as Record<string, any>).env?.VITE_API_URL ??
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://agrismart-4fcn.onrender.com/api'
    : '/api');

export async function fetchWeather(loc: string): Promise<WeatherForecast> {
  const res = await fetch(`${WEATHER_BASE}/weather?loc=${encodeURIComponent(loc)}`);
  const json = await res.json() as { error?: string } & WeatherForecast;
  if (!res.ok) throw new Error(json.error ?? 'Failed to fetch weather data.');
  return json as WeatherForecast;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export function saveWeatherCache(data: WeatherForecast): void {
  try { localStorage.setItem(LS_WEATHER, JSON.stringify(data)); } catch { /* storage full */ }
}

export function loadWeatherCache(): WeatherForecast | null {
  try {
    const raw = localStorage.getItem(LS_WEATHER);
    return raw ? (JSON.parse(raw) as WeatherForecast) : null;
  } catch { return null; }
}

export function saveLocation(loc: string): void {
  try { localStorage.setItem(LS_LOCATION, loc); } catch { /* ignore */ }
}

export function loadLocation(): string {
  return localStorage.getItem(LS_LOCATION) ?? '';
}
