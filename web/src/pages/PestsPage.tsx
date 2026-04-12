import { useState } from 'react';
import type { WeatherForecast } from '../services/weatherApi';

// ─── Pest/disease data (bundled from backend/src/data/pest-library.json) ─────

type PestType = 'FUNGAL' | 'VIRAL' | 'INSECT';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

interface Pest {
  id: string;
  name: string;
  type: PestType;
  severity: Severity;
  conditions: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
}

const PESTS: Pest[] = [
  {
    id: 'aphids',
    name: 'Aphids',
    type: 'INSECT',
    severity: 'MEDIUM',
    conditions: 'Warm, dry weather (>20°C, low humidity). Dense, lush growth.',
    symptoms: [
      'Clusters of small insects on shoot tips and leaf undersides',
      'Leaves curl downward around aphid colonies',
      'Sticky honeydew deposits leading to black sooty mould',
      'Distorted, stunted new growth',
    ],
    treatment: [
      'Spray insecticidal soap (2%) directly onto colonies',
      'Apply pyrethroid (cypermethrin) for severe infestations',
      'Introduce ladybird beetles to control populations naturally',
    ],
    prevention: [
      'Inspect growing tips regularly for early colonies',
      'Avoid excess nitrogen fertiliser — promotes soft growth aphids love',
      'Use reflective mulch to deter winged aphids',
    ],
  },
  {
    id: 'bean-stem-maggot',
    name: 'Bean Stem Maggot',
    type: 'INSECT',
    severity: 'HIGH',
    conditions: 'Early in season during warm, humid periods. Peaks during seedling stage.',
    symptoms: [
      'Wilting and yellowing of young plants',
      'Pale leaf-mining tunnels visible in leaves',
      'Swollen, discoloured stem base',
      'Larvae visible when stem is split open',
    ],
    treatment: [
      'Apply systemic insecticide (dimethoate or imidacloprid) early',
      'Drench stem base with lambda-cyhalothrin to kill larvae',
      'Remove and destroy collapsed plants immediately',
    ],
    prevention: [
      'Treat seed with thiamethoxam before planting',
      'Plant early in the season when fly populations are lower',
      'Intercrop beans with maize or sorghum to reduce pest density',
    ],
  },
  {
    id: 'whitefly',
    name: 'Whitefly',
    type: 'INSECT',
    severity: 'MEDIUM',
    conditions: 'Hot, dry conditions (>25°C). Worse in sheltered spots with poor air flow.',
    symptoms: [
      'White flying insects rise in clouds when plants are disturbed',
      'Yellow stippling on upper leaf surfaces',
      'Sticky honeydew and black sooty mould on leaves',
      'Premature leaf drop under heavy infestation',
    ],
    treatment: [
      'Apply imidacloprid or neem oil (2–3%) on leaf undersides',
      'Use yellow sticky traps to monitor and reduce adults',
      'Spray spiromesifen or buprofezin at first detection',
    ],
    prevention: [
      'Intercrop with marigold or basil to repel whiteflies',
      'Remove crop residues promptly after harvest',
      'Install insect-proof netting over seedbeds',
    ],
  },
  {
    id: 'angular-leaf-spot',
    name: 'Angular Leaf Spot',
    type: 'FUNGAL',
    severity: 'MEDIUM',
    conditions: 'High humidity (>70%), warm temperatures (18–28°C), prolonged leaf wetness.',
    symptoms: [
      'Angular, water-soaked lesions bounded by leaf veins',
      'Lesions turn brown-grey with reddish-brown border',
      'Grey powdery growth on lesions in humid conditions',
      'Premature leaf yellowing and drop',
    ],
    treatment: [
      'Apply copper-based fungicide (copper oxychloride) at first signs',
      'Spray mancozeb or chlorothalonil every 7–10 days in wet conditions',
      'Remove and destroy heavily infected plant debris',
    ],
    prevention: [
      'Use certified resistant bean varieties (e.g. MAC 44, CODMLB 001)',
      'Rotate crops — avoid beans in the same field 2 seasons in a row',
      'Ensure adequate plant spacing (30 × 50 cm) for air circulation',
    ],
  },
  {
    id: 'bean-rust',
    name: 'Bean Rust',
    type: 'FUNGAL',
    severity: 'MEDIUM',
    conditions: 'Cool nights (15–20°C) with warm days, high humidity, dew formation.',
    symptoms: [
      'Small reddish-brown pustules on undersides of leaves',
      'Pale yellow spots on upper leaf surface above pustules',
      'Yellowing and premature leaf drop in heavy infection',
      'Pustules also appear on stems and pods',
    ],
    treatment: [
      'Apply triazole fungicide (tebuconazole or propiconazole) early',
      'Use mancozeb or sulfur-based sprays every 10–14 days',
      'Remove and burn severely infected crop material',
    ],
    prevention: [
      'Use rust-resistant varieties (e.g. RWV 3006, Lyamungu 85)',
      'Avoid overhead irrigation — wet leaves spread spores',
      'Monitor fields from flowering stage onwards',
    ],
  },
  {
    id: 'anthracnose',
    name: 'Anthracnose',
    type: 'FUNGAL',
    severity: 'HIGH',
    conditions: 'Cool, wet weather. Rain splash spreads spores from infected debris.',
    symptoms: [
      'Dark brown-black lesions along veins on leaf undersides',
      'Sunken, dark cankers on stems and pods',
      'Salmon-pink spore masses on infected pods in wet weather',
      'Discoloured, shrivelled seeds inside infected pods',
    ],
    treatment: [
      'Apply carbendazim or thiophanate-methyl at 7-day intervals',
      'Use copper-based fungicide as protectant before rainy periods',
      'Destroy all infected plant material and crop debris',
    ],
    prevention: [
      'Always use certified anthracnose-free seed',
      'Treat seeds with thiram or captan before planting',
      'Do not work in the field when plants are wet',
    ],
  },
  {
    id: 'root-rot',
    name: 'Root Rot',
    type: 'FUNGAL',
    severity: 'HIGH',
    conditions: 'Waterlogged soil, poor drainage, overwatering, warm temperatures.',
    symptoms: [
      'Reddish-brown decay of tap root and lower stem',
      'Wilting and yellowing despite adequate soil moisture',
      'Stunted growth and poor pod set',
      'Complete seedling collapse in severe cases',
    ],
    treatment: [
      'Apply metalaxyl or mefenoxam drench around affected plant base',
      'Improve drainage by creating furrows or raised beds',
      'Remove and destroy severely affected plants',
    ],
    prevention: [
      'Treat seed with Apron Star (metalaxyl + thiram) before planting',
      'Avoid waterlogged soils — use raised beds where necessary',
      'Practice 3-year crop rotation, avoiding all legumes',
    ],
  },
  {
    id: 'bcmv',
    name: 'Bean Mosaic Virus (BCMV)',
    type: 'VIRAL',
    severity: 'HIGH',
    conditions: 'Spreads via aphid vectors. Worse when aphid populations are high.',
    symptoms: [
      'Mosaic pattern of light and dark green on leaves',
      'Leaf curling, distortion, and reduced leaf size',
      'Stunted plant growth overall',
      'Few, small, discoloured pods',
    ],
    treatment: [
      'Remove and destroy infected plants immediately to prevent spread',
      'Apply imidacloprid or thiamethoxam to control aphid vectors',
      'Use reflective mulch to deter aphids',
    ],
    prevention: [
      'Plant certified virus-free, resistant varieties (e.g. RWR 2245)',
      'Control aphid populations with regular monitoring and targeted spraying',
      'Avoid planting near other infected legume crops',
    ],
  },
];

// ─── Weather-based risk engine ────────────────────────────────────────────────

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface RiskAssessment {
  fungal: RiskLevel;
  insect: RiskLevel;
  sprayDelay: boolean;
  sprayWindow: string;
  fungalReason: string;
  insectReason: string;
}

function assessRisk(weather: WeatherForecast): RiskAssessment {
  const { avgTemp, avgRainfall, avgHumidity } = weather;

  // Fungal: high humidity + warm + rain = high risk
  let fungal: RiskLevel = 'LOW';
  let fungalReason = 'Conditions are not particularly favourable for fungal disease.';
  if (avgHumidity > 75 && avgTemp >= 18 && avgTemp <= 30) {
    fungal = 'HIGH';
    fungalReason = `High humidity (${avgHumidity}%) and warm temperatures (${avgTemp}°C) create ideal conditions for fungal spread.`;
  } else if (avgHumidity > 60 || avgRainfall > 8) {
    fungal = 'MEDIUM';
    fungalReason = `Moderate humidity (${avgHumidity}%) or recent rainfall increases fungal risk.`;
  }

  // Insect: warm + dry = high risk
  let insect: RiskLevel = 'LOW';
  let insectReason = 'Insect pest pressure is likely low under current conditions.';
  if (avgTemp > 25 && avgHumidity < 65 && avgRainfall < 5) {
    insect = 'HIGH';
    insectReason = `Hot (${avgTemp}°C) and dry conditions (${avgRainfall} mm/day) are ideal for aphids, whiteflies, and stem maggots.`;
  } else if (avgTemp > 20) {
    insect = 'MEDIUM';
    insectReason = `Warm temperatures (${avgTemp}°C) support moderate insect activity. Monitor plants regularly.`;
  }

  // Spray timing — delay if rain is expected in next day or two
  const rainyDays = weather.days.slice(0, 3).filter((d) => d.rainfall > 5);
  const sprayDelay = rainyDays.length >= 2;
  const sprayWindow = sprayDelay
    ? `Delay spraying — rain expected (${rainyDays.map((d) => d.dayName).join(', ')}). Pesticides will be washed off.`
    : 'Good spray window — early morning (6–8 AM) or evening (5–7 PM). Avoid spraying in wind or midday heat.';

  return { fungal, insect, sprayDelay, sprayWindow, fungalReason, insectReason };
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const RISK_STYLE: Record<RiskLevel, { badge: string; dot: string }> = {
  LOW:    { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  MEDIUM: { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
  HIGH:   { badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500'   },
};

const TYPE_STYLE: Record<PestType, { label: string; color: string }> = {
  FUNGAL: { label: 'Fungal',   color: 'bg-purple-100 text-purple-700' },
  VIRAL:  { label: 'Viral',    color: 'bg-pink-100 text-pink-700' },
  INSECT: { label: 'Insect',   color: 'bg-orange-100 text-orange-700' },
};

const SEV_STYLE: Record<Severity, string> = {
  LOW:    'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH:   'bg-red-100 text-red-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PestsPageProps {
  weather: WeatherForecast | null;
}

type FilterType = 'ALL' | PestType;

export function PestsPage({ weather }: PestsPageProps) {
  const [filter, setFilter]       = useState<FilterType>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const risk = weather ? assessRisk(weather) : null;

  const filtered = filter === 'ALL'
    ? PESTS
    : PESTS.filter((p) => p.type === filter);

  const toggle = (id: string) => setExpandedId((v) => (v === id ? null : id));

  return (
    <div className="px-4 py-4 space-y-4">

      <div>
        <h2 className="text-base font-bold text-gray-900">Pest & Disease Management</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Weather-based risk alerts and treatment guidance for common bean problems.
        </p>
      </div>

      {/* ── Weather-based risk assessment ── */}
      {risk ? (
        <section aria-label="Current pest and disease risk" className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Risk — {weather!.location}</p>

          <div className="grid grid-cols-2 gap-2">
            <RiskCard
              label="Fungal Disease Risk"
              icon="🍄"
              level={risk.fungal}
              reason={risk.fungalReason}
            />
            <RiskCard
              label="Insect Pest Risk"
              icon="🐛"
              level={risk.insect}
              reason={risk.insectReason}
            />
          </div>

          {/* Spray timing */}
          <div className={`flex items-start gap-3 rounded-2xl p-3 border ${
            risk.sprayDelay
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
              {risk.sprayDelay ? '🌧️' : '🕐'}
            </span>
            <div>
              <p className={`text-xs font-semibold ${risk.sprayDelay ? 'text-amber-800' : 'text-green-800'}`}>
                {risk.sprayDelay ? 'Delay Spraying' : 'Good Spray Window'}
              </p>
              <p className={`text-xs mt-0.5 ${risk.sprayDelay ? 'text-amber-700' : 'text-green-700'}`}>
                {risk.sprayWindow}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">⛅</span>
          <p className="text-sm text-amber-800">
            Go to <strong>Weather</strong> and enter your location for a risk assessment based on current conditions.
          </p>
        </div>
      )}

      {/* ── Spray general guidance ── */}
      <section aria-label="Spray safety tips" className="bg-white border border-gray-200 rounded-2xl p-3 space-y-1.5">
        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <span aria-hidden="true">⚠️</span> Safe Spraying Rules
        </h3>
        {[
          'Always read the pesticide label before mixing',
          'Wear protective gloves, mask, and clothing when spraying',
          'Never spray in strong wind — pesticide will drift off target',
          'Do not spray within 2 weeks of harvest',
          'Keep children and animals away during and after spraying',
        ].map((rule) => (
          <div key={rule} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="text-green-600 shrink-0 mt-0.5">•</span>
            {rule}
          </div>
        ))}
      </section>

      {/* ── Pest/disease library ── */}
      <section aria-label="Pest and disease guide">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Identification Guide</h3>
          <span className="text-xs text-gray-400">{filtered.length} entries</span>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4">
          {(['ALL', 'INSECT', 'FUNGAL', 'VIRAL'] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[36px] ${
                filter === f
                  ? 'bg-green-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'FUNGAL' ? '🍄 Fungal' : f === 'INSECT' ? '🐛 Insects' : '🦠 Viral'}
            </button>
          ))}
        </div>

        {/* Cards */}
        <ul className="space-y-2">
          {filtered.map((pest) => (
            <PestCard
              key={pest.id}
              pest={pest}
              expanded={expandedId === pest.id}
              onToggle={() => toggle(pest.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskCard({ label, icon, level, reason }: {
  label: string; icon: string; level: RiskLevel; reason: string;
}) {
  const s = RISK_STYLE[level];
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} aria-hidden="true" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{level}</span>
      </div>
      <p className="text-xs text-gray-500 leading-tight">{reason}</p>
    </div>
  );
}

function PestCard({ pest, expanded, onToggle }: {
  pest: Pest; expanded: boolean; onToggle: () => void;
}) {
  const typeStyle = TYPE_STYLE[pest.type];
  const sevStyle  = SEV_STYLE[pest.severity];

  return (
    <li className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[56px]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{pest.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeStyle.color}`}>
              {typeStyle.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${sevStyle}`}>
              {pest.severity}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{pest.conditions}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Conditions */}
          <div className="pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Favourable Conditions</p>
            <p className="text-sm text-gray-700">{pest.conditions}</p>
          </div>

          {/* Symptoms */}
          <DetailSection title="Symptoms" icon="🔍" items={pest.symptoms} itemColor="text-red-500" />

          {/* Treatment */}
          <DetailSection title="Treatment" icon="💊" items={pest.treatment} itemColor="text-blue-500" />

          {/* Prevention */}
          <DetailSection title="Prevention" icon="🛡️" items={pest.prevention} itemColor="text-green-600" />
        </div>
      )}
    </li>
  );
}

function DetailSection({ title, icon, items, itemColor }: {
  title: string; icon: string; items: string[]; itemColor: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
        <span aria-hidden="true">{icon}</span> {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`shrink-0 mt-0.5 ${itemColor}`} aria-hidden="true">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
