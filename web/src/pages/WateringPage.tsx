import { useState } from 'react';
import type { WeatherForecast } from '../services/weatherApi';

// ─── Growth stages (beans) ────────────────────────────────────────────────────

interface GrowthStage {
  id: string;
  label: string;
  days: string;
  icon: string;
  /** Daily water need in mm */
  dailyNeedMm: number;
  description: string;
  tips: string[];
}

const GROWTH_STAGES: GrowthStage[] = [
  {
    id: 'germination',
    label: 'Germination',
    days: 'Days 1–10',
    icon: '🌰',
    dailyNeedMm: 8,
    description: 'Seeds are absorbing water and sprouting. Soil must stay consistently moist but not waterlogged.',
    tips: [
      'Water gently to avoid washing away seeds',
      'Check soil moisture twice daily — surface should feel damp',
      'Avoid waterlogging; ensure good drainage',
    ],
  },
  {
    id: 'vegetative',
    label: 'Vegetative',
    days: 'Days 11–30',
    icon: '🌿',
    dailyNeedMm: 7,
    description: 'Plant is building leaves and roots. Moderate watering keeps growth steady.',
    tips: [
      'Water deeply every 2–3 days to encourage deep root growth',
      'Water at the base of plants, not on the leaves',
      'Watch for wilting in the afternoon heat',
    ],
  },
  {
    id: 'flowering',
    label: 'Flowering',
    days: 'Days 31–55',
    icon: '🌸',
    dailyNeedMm: 12,
    description: 'Most critical stage — water stress now causes flower drop and poor pod set. Do not let the soil dry out.',
    tips: [
      'This is the most water-sensitive stage — never let soil dry out',
      'Water every 1–2 days during dry spells',
      'Mulch around plants to retain soil moisture',
    ],
  },
  {
    id: 'pod_fill',
    label: 'Pod Fill',
    days: 'Days 56–75',
    icon: '🫘',
    dailyNeedMm: 10,
    description: 'Pods are filling with beans. Consistent moisture is needed for full, healthy beans.',
    tips: [
      'Maintain consistent soil moisture for uniform pod fill',
      'Avoid large swings between wet and dry — causes cracked pods',
      'Begin reducing water slightly as pods reach full size',
    ],
  },
  {
    id: 'maturity',
    label: 'Maturity',
    days: 'Days 76–90',
    icon: '🌾',
    dailyNeedMm: 4,
    description: 'Beans are nearly ready for harvest. Reduce watering to allow pods to dry properly.',
    tips: [
      'Reduce watering significantly — excess moisture delays harvest',
      'Allow soil to partially dry between waterings',
      'Stop watering entirely 1 week before planned harvest',
    ],
  },
];

// ─── Watering recommendation engine ──────────────────────────────────────────

type WaterLevel = 'none' | 'monitor' | 'light' | 'moderate' | 'thorough';

interface WateringAdvice {
  level: WaterLevel;
  headline: string;
  detail: string;
  amount?: string;
  timing: string;
}

function computeWatering(
  stage: GrowthStage,
  avgTemp: number,
  avgRainfall: number,
): WateringAdvice {
  // Temperature adjustment: high heat increases evapotranspiration
  const tempBoost = avgTemp > 28 ? 3 : avgTemp > 24 ? 1.5 : 0;
  const adjustedNeed = stage.dailyNeedMm + tempBoost;
  const deficit = Math.max(0, adjustedNeed - avgRainfall);

  if (deficit === 0) {
    return {
      level: 'none',
      headline: 'No watering needed',
      detail: `Current rainfall (${avgRainfall} mm/day avg) is meeting the water needs of your beans at this growth stage.`,
      timing: 'Continue monitoring daily rainfall.',
    };
  }
  if (deficit <= 2) {
    return {
      level: 'monitor',
      headline: 'Monitor closely',
      detail: `Rainfall is almost sufficient but slightly low. Check soil moisture daily and water if the surface feels dry.`,
      timing: 'Water in the early morning (6–8 AM) if needed.',
    };
  }
  if (deficit <= 5) {
    return {
      level: 'light',
      headline: 'Water lightly',
      detail: `Rainfall is providing ${avgRainfall} mm/day but your beans need ~${adjustedNeed.toFixed(1)} mm/day at this stage. Apply a light supplemental watering.`,
      amount: '15–20 litres per m²',
      timing: 'Early morning (6–8 AM) or evening (5–7 PM) — avoid midday heat.',
    };
  }
  if (deficit <= 9) {
    return {
      level: 'moderate',
      headline: 'Water moderately',
      detail: `Rainfall is significantly below crop needs (${avgRainfall} mm vs ~${adjustedNeed.toFixed(1)} mm needed/day). Apply a good watering to prevent stress.`,
      amount: '25–30 litres per m²',
      timing: 'Early morning (6–8 AM) — allows foliage to dry before evening.',
    };
  }
  return {
    level: 'thorough',
    headline: 'Water thoroughly today',
    detail: `Very little rainfall — your beans are at risk of drought stress. Apply a thorough watering immediately${avgTemp > 28 ? ` (high temperature of ${avgTemp}°C is increasing water loss further)` : ''}.`,
    amount: '35–40 litres per m²',
    timing: 'Water now or first thing in the morning. Check soil moisture every 12 hours.',
  };
}

// ─── Visual config ────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<WaterLevel, { bg: string; border: string; badge: string; icon: string }> = {
  none:     { bg: 'bg-blue-50',   border: 'border-blue-400',   badge: 'bg-blue-100 text-blue-800',     icon: '✅' },
  monitor:  { bg: 'bg-sky-50',    border: 'border-sky-400',    badge: 'bg-sky-100 text-sky-800',       icon: '👁️' },
  light:    { bg: 'bg-yellow-50', border: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-800', icon: '💧' },
  moderate: { bg: 'bg-orange-50', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-800', icon: '🪣' },
  thorough: { bg: 'bg-red-50',    border: 'border-red-400',    badge: 'bg-red-100 text-red-700',       icon: '🚿' },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface WateringPageProps {
  weather: WeatherForecast | null;
}

export function WateringPage({ weather }: WateringPageProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('vegetative');
  const selectedStage = GROWTH_STAGES.find((s) => s.id === selectedStageId)!;

  const advice = weather
    ? computeWatering(selectedStage, weather.avgTemp, weather.avgRainfall)
    : null;

  const style = advice ? LEVEL_STYLE[advice.level] : null;

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── Section heading ── */}
      <div>
        <h2 className="text-base font-bold text-gray-900">Smart Watering Guidance</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Select your crop stage to get a personalised watering recommendation.
        </p>
      </div>

      {/* ── Growth stage selector ── */}
      <section aria-label="Select crop growth stage">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Current growth stage
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
          {GROWTH_STAGES.map((stage) => {
            const active = stage.id === selectedStageId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                aria-pressed={active}
                className={`flex-shrink-0 snap-start flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border-2 transition-all min-w-[72px] min-h-[44px] ${
                  active
                    ? 'border-green-600 bg-green-700 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden="true">{stage.icon}</span>
                <span className="text-xs font-semibold leading-tight text-center">{stage.label}</span>
                <span className={`text-xs leading-none ${active ? 'text-green-200' : 'text-gray-400'}`}>
                  {stage.days}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Stage description ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{selectedStage.icon}</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{selectedStage.label} Stage</h3>
            <p className="text-xs text-gray-500">{selectedStage.days}</p>
          </div>
          <span className="ml-auto text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
            Needs ~{selectedStage.dailyNeedMm} mm/day
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{selectedStage.description}</p>
      </div>

      {/* ── No weather prompt ── */}
      {!weather && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden="true">⛅</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Weather data needed</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Go to the <strong>Weather</strong> tab and enter your location to get a personalised watering recommendation.
            </p>
          </div>
        </div>
      )}

      {/* ── Watering recommendation ── */}
      {advice && style && (
        <section
          aria-label="Watering recommendation"
          className={`border-2 rounded-2xl p-4 space-y-3 ${style.bg} ${style.border}`}
        >
          {/* Headline */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">{style.icon}</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${style.badge}`}>
              {advice.headline}
            </span>
          </div>

          {/* Detail */}
          <p className="text-sm text-gray-700 leading-relaxed">{advice.detail}</p>

          {/* Amount if applicable */}
          {advice.amount && (
            <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-white">
              <span className="text-base" aria-hidden="true">💧</span>
              <div>
                <span className="text-xs text-gray-500">Recommended amount</span>
                <p className="text-sm font-bold text-gray-900">{advice.amount}</p>
              </div>
            </div>
          )}

          {/* Timing */}
          <div className="flex items-start gap-2 bg-white/70 rounded-xl px-3 py-2 border border-white">
            <span className="text-base shrink-0 mt-0.5" aria-hidden="true">🕐</span>
            <div>
              <span className="text-xs text-gray-500">Best time to water</span>
              <p className="text-sm text-gray-800">{advice.timing}</p>
            </div>
          </div>

          {/* Current conditions */}
          {weather && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <CondBadge label="Avg Rainfall" value={`${weather.avgRainfall} mm/day`} />
              <CondBadge label="Avg Temp" value={`${weather.avgTemp}°C`} />
            </div>
          )}
        </section>
      )}

      {/* ── Stage-specific tips ── */}
      <section aria-label="Watering tips for this stage" className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <span aria-hidden="true">💡</span> Tips for {selectedStage.label} Stage
        </h3>
        <ul className="space-y-1.5">
          {selectedStage.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5 shrink-0" aria-hidden="true">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* ── General watering guidelines ── */}
      <section aria-label="General watering guidelines" className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">General Guidelines</h3>
        <div className="space-y-2">
          {[
            { icon: '⏰', text: 'Best time to water: early morning (6–8 AM) or evening (5–7 PM)' },
            { icon: '🌞', text: 'Avoid watering during midday — up to 40% evaporates before reaching roots' },
            { icon: '🌧️', text: 'After heavy rain (>15 mm), skip watering for 1–2 days' },
            { icon: '🌡️', text: 'On hot days (>28°C), plants need extra water due to heat stress' },
            { icon: '🍃', text: 'Water at the base of plants, not on leaves, to prevent fungal disease' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-2 text-xs text-gray-600">
              <span aria-hidden="true">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CondBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/70 border border-white rounded-xl px-3 py-2 text-center">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-bold text-gray-800">{value}</div>
    </div>
  );
}
