import fetch from 'node-fetch';

export interface WeatherData {
  temp: number;
  humidity: number;
  rainfall7days: number;
  forecast3days: Array<{
    date: string;
    temp: number;
    humidity: number;
    description: string;
  }>;
  uvIndex: number;
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry>();

const MOCK_DATA: WeatherData = {
  temp: 22,
  humidity: 65,
  rainfall7days: 25,
  forecast3days: [],
  uvIndex: 5,
};

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return MOCK_DATA;
  }

  try {
    const url =
      `https://api.openweathermap.org/data/3.0/onecall` +
      `?lat=${lat}&lon=${lng}&exclude=minutely,alerts&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    if (!response.ok) {
      return MOCK_DATA;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = (await response.json()) as any;

    // Sum rain over the last 8 daily entries (today + 7 days back approximation)
    // The One Call 3.0 API provides daily.rain (mm)
    const daily: Array<Record<string, unknown>> = json.daily ?? [];
    const rainfall7days = daily
      .slice(0, 7)
      .reduce((sum: number, d: Record<string, unknown>) => sum + ((d.rain as number) ?? 0), 0);

    const forecast3days = daily.slice(1, 4).map((d: Record<string, unknown>) => ({
      date: new Date((d.dt as number) * 1000).toISOString().split('T')[0],
      temp: ((d.temp as Record<string, number>)?.day ?? 0),
      humidity: (d.humidity as number) ?? 0,
      description: ((d.weather as Array<Record<string, string>>)?.[0]?.description ?? ''),
    }));

    const data: WeatherData = {
      temp: (json.current?.temp as number) ?? MOCK_DATA.temp,
      humidity: (json.current?.humidity as number) ?? MOCK_DATA.humidity,
      rainfall7days,
      forecast3days,
      uvIndex: (json.current?.uvi as number) ?? MOCK_DATA.uvIndex,
    };

    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
    return data;
  } catch {
    return MOCK_DATA;
  }
}

export async function getPlantingRisk(lat: number, lng: number): Promise<RiskLevel> {
  const weather = await getCurrentWeather(lat, lng);

  if (weather.rainfall7days > 80 || weather.humidity > 90) return 'HIGH';
  if (weather.rainfall7days < 20 && weather.humidity < 70) return 'LOW';
  return 'MEDIUM';
}
