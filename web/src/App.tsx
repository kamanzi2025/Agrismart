import { useState } from 'react';
import { FarmerAuthPage } from './pages/FarmerAuthPage';
import { WeatherPage }    from './pages/WeatherPage';
import { PlantingPage }   from './pages/PlantingPage';
import { WateringPage }   from './pages/WateringPage';
import { PestsPage }      from './pages/PestsPage';
import { FinancePage }    from './pages/FinancePage';
import { useAuthStore }   from './store/authStore';
import type { WeatherForecast } from './services/weatherApi';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'weather' | 'planting' | 'watering' | 'pests' | 'finance';

const TABS: { id: Tab; label: string; icon: string; ariaLabel: string }[] = [
  { id: 'weather',  label: 'Weather',  icon: '⛅', ariaLabel: 'Weather forecast'       },
  { id: 'planting', label: 'Planting', icon: '🌱', ariaLabel: 'Planting calendar'      },
  { id: 'watering', label: 'Watering', icon: '💧', ariaLabel: 'Smart watering guidance' },
  { id: 'pests',    label: 'Pests',    icon: '🐛', ariaLabel: 'Pest & disease guide'   },
  { id: 'finance',  label: 'Finance',  icon: '💰', ariaLabel: 'Farm finance'           },
];

const PAGE_TITLE: Record<Tab, string> = {
  weather:  'Weather Forecast',
  planting: 'Planting Calendar',
  watering: 'Smart Watering',
  pests:    'Pest & Disease',
  finance:  'Farm Finance',
};

// ─── Root ─────────────────────────────────────────────────────────────────────

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto min-h-screen">
        <FarmerAuthPage />
      </div>
    );
  }

  return <FarmerApp user={user} onLogout={logout} />;
}

export default App;

// ─── Authenticated shell ──────────────────────────────────────────────────────

function FarmerApp({ user, onLogout }: { user: { name: string }; onLogout: () => void }) {
  const [activeTab, setActiveTab]     = useState<Tab>('weather');
  const [showLogout, setShowLogout]   = useState(false);
  const [weather, setWeather]         = useState<WeatherForecast | null>(null);
  const [weatherStale, setWeatherStale] = useState(false);

  const onWeatherUpdate = (data: WeatherForecast, stale = false) => {
    setWeather(data);
    setWeatherStale(stale);
  };

  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">

      {/* ── Header ── */}
      <header className="bg-green-800 text-white px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">🌾</span>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-none">AgriSmart</h1>
              <p className="text-green-300 text-xs mt-0.5 truncate">
                Hello, {user.name.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Avatar / account menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLogout((v) => !v)}
              aria-label="Account options"
              aria-expanded={showLogout}
              className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center text-xs font-bold transition-colors min-w-[44px] min-h-[44px]"
            >
              {initials}
            </button>

            {showLogout && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLogout(false)} aria-hidden="true" />
                <div className="absolute right-0 top-11 z-20 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[160px] py-1 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Farmer</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowLogout(false); onLogout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 min-h-[44px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-green-200 text-xs mt-2 font-medium">{PAGE_TITLE[activeTab]}</p>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto pb-20" id="main-content">
        {activeTab === 'weather'  && <WeatherPage  weather={weather} onWeatherUpdate={(d) => onWeatherUpdate(d, false)} />}
        {activeTab === 'planting' && <PlantingPage weather={weather} isStale={weatherStale} />}
        {activeTab === 'watering' && <WateringPage weather={weather} />}
        {activeTab === 'pests'    && <PestsPage    weather={weather} />}
        {activeTab === 'finance'  && <FinancePage />}
      </main>

      {/* ── Bottom nav (5 tabs) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex z-10"
        aria-label="Main navigation"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.ariaLabel}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors relative ${
                active ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-green-700 rounded-full" aria-hidden="true" />
              )}
              <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-green-700' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
