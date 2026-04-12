import { useState, useEffect, useRef } from 'react';
import {
  fetchWeather,
  saveWeatherCache,
  loadWeatherCache,
  saveLocation,
  loadLocation,
  type WeatherForecast,
} from '../services/weatherApi';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeatherPageProps {
  weather: WeatherForecast | null;
  onWeatherUpdate: (data: WeatherForecast) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatStaleTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ConditionLabel({ condition }: { condition: string }) {
  const map: Record<string, string> = {
    sunny: 'text-yellow-600 bg-yellow-50',
    cloudy: 'text-gray-600 bg-gray-100',
    rain: 'text-blue-600 bg-blue-50',
    'heavy rain': 'text-indigo-700 bg-indigo-50',
  };
  const cls = map[condition] ?? 'text-gray-600 bg-gray-100';
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${cls}`}>
      {condition}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeatherPage({ weather, onWeatherUpdate }: WeatherPageProps) {
  const [input, setInput]       = useState(() => loadLocation());
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [isStale, setIsStale]   = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  // On mount: restore last cached forecast (WM-03, WM-08)
  useEffect(() => {
    if (!weather) {
      const cached = loadWeatherCache();
      if (cached) {
        onWeatherUpdate(cached);
        setIsStale(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doFetch = async (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setLoading(true);
    setError('');
    try {
      const data = await fetchWeather(trimmed);
      onWeatherUpdate(data);
      saveWeatherCache(data);
      saveLocation(trimmed);
      setIsStale(false);
    } catch (err) {
      // Offline fallback: serve cached data with stale warning (WM-08)
      const cached = loadWeatherCache();
      if (cached) {
        onWeatherUpdate(cached);
        setIsStale(true);
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Could not load weather. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doFetch(input);
  };

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── Location search (WM-01, WM-02, WM-03) ── */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter town or district…"
          aria-label="Location"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Search weather"
          className="px-4 py-3 bg-green-700 text-white rounded-xl font-medium text-sm disabled:opacity-50 hover:bg-green-800 transition-colors min-w-[44px] min-h-[44px]"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
        </button>
        {/* Manual refresh (WM-09) */}
        {weather && (
          <button
            type="button"
            onClick={() => doFetch(input || weather.location.split(',')[0])}
            disabled={loading}
            aria-label="Refresh weather"
            title="Refresh"
            className="px-3 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors min-w-[44px] min-h-[44px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5" />
            </svg>
          </button>
        )}
      </form>

      {/* ── Error message (inline, no alert dialog — SRS §3.4) ── */}
      {error && (
        <div role="alert" className="text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ── Stale-data warning (WM-08) ── */}
      {isStale && weather && (
        <div role="status" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <span>Showing cached data from {formatStaleTime(weather.fetchedAt)}. Connect to update.</span>
        </div>
      )}

      {weather && (
        <>
          {/* ── Location name ── */}
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
            </svg>
            <h2 className="text-base font-semibold text-gray-900">{weather.location}</h2>
          </div>

          {/* ── Summary stats tiles (WM-07) ── */}
          <div className="grid grid-cols-3 gap-2" role="region" aria-label="Weekly weather summary">
            <StatTile
              label="Avg Temp"
              value={`${weather.avgTemp}°C`}
              icon="🌡️"
              color="bg-orange-50 border-orange-100"
            />
            <StatTile
              label="Avg Rain"
              value={`${weather.avgRainfall} mm`}
              icon="💧"
              color="bg-blue-50 border-blue-100"
            />
            <StatTile
              label="Humidity"
              value={`${weather.avgHumidity}%`}
              icon="🌫️"
              color="bg-teal-50 border-teal-100"
            />
          </div>

          {/* ── 7-day forecast horizontal scroll (WM-04, WM-05, WM-06) ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">7-Day Forecast</h3>
            <div
              className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
              role="list"
              aria-label="7-day forecast"
            >
              {weather.days.map((day, i) => (
                <DayCard key={day.date} day={day} isToday={i === 0} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!weather && !loading && !error && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🌤️</div>
          <p className="text-sm">Enter your location to see the weather forecast.</p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({ label, value, icon, color }: {
  label: string; value: string; icon: string; color: string;
}) {
  return (
    <div className={`border rounded-xl p-3 flex flex-col items-center gap-1 ${color}`}>
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <span className="text-base font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

function DayCard({ day, isToday }: { day: WeatherForecast['days'][number]; isToday: boolean }) {
  return (
    <article
      role="listitem"
      className={`flex-shrink-0 w-24 rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${
        isToday
          ? 'bg-green-700 border-green-700 text-white'
          : 'bg-white border-gray-200 text-gray-800'
      }`}
      aria-label={`${isToday ? 'Today' : day.dayName}: ${day.condition}, ${day.tempHigh}°C, ${day.rainfall}mm rain`}
    >
      <span className={`text-xs font-semibold ${isToday ? 'text-green-100' : 'text-gray-500'}`}>
        {isToday ? 'Today' : day.dayName}
      </span>
      <span className="text-2xl" aria-hidden="true">{day.icon}</span>
      <span className="text-sm font-bold">{day.tempHigh}°C</span>
      <span className={`text-xs ${isToday ? 'text-green-200' : 'text-blue-600'}`}>
        {day.rainfall} mm
      </span>
      {!isToday && <ConditionLabel condition={day.condition} />}
    </article>
  );
}
