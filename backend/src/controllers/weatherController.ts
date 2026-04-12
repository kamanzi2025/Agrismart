import { Request, Response } from 'express';
import fetch from 'node-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayForecast {
  date: string;
  dayName: string;
  tempHigh: number;
  rainfall: number;
  humidity: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'heavy rain';
  icon: string;
}

export interface ForecastResponse {
  location: string;
  days: DayForecast[];
  avgTemp: number;
  avgRainfall: number;
  avgHumidity: number;
  fetchedAt: string;
}

interface CacheEntry {
  data: ForecastResponse;
  expiresAt: number;
}

// ─── Cache (30-minute TTL as per SRS §7.1) ───────────────────────────────────

const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

// ─── WMO weather code → condition + icon ─────────────────────────────────────

function wmoToCondition(code: number): { condition: DayForecast['condition']; icon: string } {
  if (code === 0)         return { condition: 'sunny',      icon: '☀️' };
  if (code <= 3)          return { condition: 'cloudy',     icon: '⛅' };
  if (code <= 48)         return { condition: 'cloudy',     icon: '☁️' };
  if (code <= 82)         return { condition: 'rain',       icon: '🌧️' };
  if (code <= 86)         return { condition: 'rain',       icon: '🌧️' };
  return                         { condition: 'heavy rain', icon: '⛈️' };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Controller ──────────────────────────────────────────────────────────────

export async function getWeather(req: Request, res: Response): Promise<void> {
  const loc = (req.query.loc as string | undefined)?.trim();

  if (!loc) {
    res.status(400).json({ error: 'loc query parameter is required' });
    return;
  }

  // Serve from cache if still fresh
  const cacheKey = loc.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    res.json(cached.data);
    return;
  }

  try {
    // ── 1. Geocode location name → lat/lon using Open-Meteo geocoding ──────
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(10_000) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geoJson = (await geoRes.json()) as any;

    const geoResult = geoJson.results?.[0];
    if (!geoResult) {
      res.status(404).json({ error: 'Location not found. Try a nearby town or district name.' });
      return;
    }

    const { latitude, longitude, name, country } = geoResult;
    const locationName: string = country ? `${name}, ${country}` : name;

    // ── 2. Fetch 7-day daily forecast + hourly humidity from Open-Meteo ────
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,precipitation_sum,weathercode` +
      `&hourly=relative_humidity_2m` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const forecastRes = await fetch(forecastUrl, { signal: AbortSignal.timeout(10_000) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forecastJson = (await forecastRes.json()) as any;

    const daily  = forecastJson.daily;
    const hourly = forecastJson.hourly;

    // Compute daily humidity averages from hourly data (24 values per day)
    const hourlyHumidity: number[] = hourly?.relative_humidity_2m ?? [];
    const dailyHumidity = (daily.time as string[]).map((_: string, i: number) => {
      const slice = hourlyHumidity.slice(i * 24, i * 24 + 24).filter((v) => v != null);
      if (!slice.length) return 0;
      return Math.round(slice.reduce((s, v) => s + v, 0) / slice.length);
    });

    // Build per-day objects
    const days: DayForecast[] = (daily.time as string[]).map((date: string, i: number) => {
      const d = new Date(date + 'T12:00:00');
      const { condition, icon } = wmoToCondition(daily.weathercode?.[i] ?? 0);
      return {
        date,
        dayName:   DAY_NAMES[d.getDay()],
        tempHigh:  Math.round((daily.temperature_2m_max?.[i]  ?? 0) * 10) / 10,
        rainfall:  Math.round((daily.precipitation_sum?.[i]   ?? 0) * 10) / 10,
        humidity:  dailyHumidity[i],
        condition,
        icon,
      };
    });

    // Compute weekly averages (SRS WM-07)
    const avgTemp     = Math.round(days.reduce((s, d) => s + d.tempHigh, 0) / days.length * 10) / 10;
    const avgRainfall = Math.round(days.reduce((s, d) => s + d.rainfall, 0) / days.length * 10) / 10;
    const avgHumidity = Math.round(days.reduce((s, d) => s + d.humidity, 0) / days.length);

    const data: ForecastResponse = {
      location: locationName,
      days,
      avgTemp,
      avgRainfall,
      avgHumidity,
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });
    res.json(data);
  } catch {
    res.status(503).json({ error: 'Weather service temporarily unavailable. Please try again.' });
  }
}
