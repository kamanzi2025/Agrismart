import type { WeatherForecast } from '../services/weatherApi';

// ─── Beans agronomic thresholds (SRS §4.2) ───────────────────────────────────

const BEANS = {
  minTemp: 16,
  maxTemp: 27,
  minRain: 10,
  maxRain: 35,
  windows: [
    { label: 'Season A', months: 'Feb – Apr' },
    { label: 'Season B', months: 'Aug – Oct' },
  ],
} as const;

// ─── Rating logic (SRS §4.4) ─────────────────────────────────────────────────

type RatingStatus = 'GOOD' | 'NOT_IDEAL' | 'WAIT';

interface Rating {
  status: RatingStatus;
  label: string;      // plain-text label (SRS PC-07)
  reason: string;
  color: 'green' | 'amber' | 'red';
}

function computeRating(avgTemp: number, avgRainfall: number): Rating {
  const tempOk = avgTemp     >= BEANS.minTemp && avgTemp     <= BEANS.maxTemp;
  const rainOk = avgRainfall >= BEANS.minRain && avgRainfall <= BEANS.maxRain;

  if (tempOk && rainOk) {
    return {
      status: 'GOOD',
      label: 'Good conditions now — plant beans',
      reason: 'Temperature and rainfall are both within the ideal range for beans.',
      color: 'green',
    };
  }
  if (tempOk && !rainOk) {
    return {
      status: 'NOT_IDEAL',
      label: 'Conditions not ideal',
      reason: avgRainfall < BEANS.minRain
        ? `Rainfall is too low (${avgRainfall} mm/day avg). Beans need at least ${BEANS.minRain} mm/day to avoid drought stress.`
        : `Rainfall is too high (${avgRainfall} mm/day avg). Above ${BEANS.maxRain} mm/day risks waterlogging and fungal disease.`,
      color: 'amber',
    };
  }
  if (!tempOk && rainOk) {
    return {
      status: 'NOT_IDEAL',
      label: 'Conditions not ideal',
      reason: avgTemp < BEANS.minTemp
        ? `Temperature is too low (${avgTemp}°C avg). Below ${BEANS.minTemp}°C stunts germination.`
        : `Temperature is too high (${avgTemp}°C avg). Above ${BEANS.maxTemp}°C reduces pod set.`,
      color: 'amber',
    };
  }
  return {
    status: 'WAIT',
    label: 'Wait for a better season',
    reason: 'Both temperature and rainfall are outside the ideal range for beans. Monitor the forecast and wait for the next planting season.',
    color: 'red',
  };
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const BADGE_COLORS: Record<Rating['color'], string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red:   'bg-red-100   text-red-800   border-red-200',
};

const CARD_ACCENT: Record<Rating['color'], string> = {
  green: 'border-green-500',
  amber: 'border-amber-400',
  red:   'border-red-400',
};

const ICON: Record<Rating['color'], string> = {
  green: '✅',
  amber: '⚠️',
  red:   '🚫',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlantingPageProps {
  weather: WeatherForecast | null;
  isStale: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlantingPage({ weather, isStale }: PlantingPageProps) {
  // PC-09: only load rating after weather data is available
  if (!weather) {
    return (
      <div className="px-4 py-12 text-center text-gray-400">
        <div className="text-5xl mb-3">🌱</div>
        <p className="text-sm">Go to the <strong>Weather</strong> tab first and enter your location to get planting advice.</p>
      </div>
    );
  }

  const rating = computeRating(weather.avgTemp, weather.avgRainfall);

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── Stale data warning (PC-10) ── */}
      {isStale && (
        <div role="status" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <span>Based on cached weather data from {new Date(weather.fetchedAt).toLocaleDateString()}. Connect to refresh.</span>
        </div>
      )}

      {/* ── Rating card (PC-06, PC-07, PC-08) ── */}
      <section
        aria-label="Beans planting rating"
        className={`bg-white border-2 rounded-2xl p-5 space-y-3 ${CARD_ACCENT[rating.color]}`}
      >
        {/* Icon + badge (colour + text — SRS §6.2) */}
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{ICON[rating.color]}</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${BADGE_COLORS[rating.color]}`}>
            {rating.label}
          </span>
        </div>

        {/* Reason (PC-06) */}
        <p className="text-sm text-gray-700 leading-relaxed">{rating.reason}</p>

        {/* Current values (PC-08) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <ValueTile
            label="Avg Temperature"
            value={`${weather.avgTemp}°C`}
            range={`${BEANS.minTemp}–${BEANS.maxTemp}°C ideal`}
            inRange={weather.avgTemp >= BEANS.minTemp && weather.avgTemp <= BEANS.maxTemp}
          />
          <ValueTile
            label="Avg Daily Rainfall"
            value={`${weather.avgRainfall} mm`}
            range={`${BEANS.minRain}–${BEANS.maxRain} mm ideal`}
            inRange={weather.avgRainfall >= BEANS.minRain && weather.avgRainfall <= BEANS.maxRain}
          />
        </div>
      </section>

      {/* ── Recommended planting windows (PC-06) ── */}
      <section aria-label="Recommended planting windows" className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span aria-hidden="true">📅</span> Best Planting Windows for Beans
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {BEANS.windows.map((w) => (
            <div key={w.label} className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-xs text-green-700 font-semibold">{w.label}</div>
              <div className="text-sm font-bold text-green-900 mt-0.5">{w.months}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 pt-1">
          Aligns with Rwanda's two main rainy seasons.
        </p>
      </section>

      {/* ── Threshold reference ── */}
      <section aria-label="Beans threshold reference" className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Beans Growing Requirements</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <ThresholdRow
            label="Temperature"
            min={`${BEANS.minTemp}°C`}
            max={`${BEANS.maxTemp}°C`}
            note="Below stunts germination; above reduces pod set"
          />
          <ThresholdRow
            label="Daily Rainfall"
            min={`${BEANS.minRain} mm`}
            max={`${BEANS.maxRain} mm`}
            note="Below risks drought; above risks waterlogging"
          />
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ValueTile({
  label, value, range, inRange,
}: {
  label: string; value: string; range: string; inRange: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 border ${inRange ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className={`text-base font-bold ${inRange ? 'text-green-800' : 'text-red-700'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{range}</div>
    </div>
  );
}

function ThresholdRow({
  label, min, max, note,
}: {
  label: string; min: string; max: string; note: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 font-medium text-gray-700">{label}</span>
      <span className="text-gray-500">
        {min} – {max} <span className="text-xs text-gray-400">({note})</span>
      </span>
    </div>
  );
}
