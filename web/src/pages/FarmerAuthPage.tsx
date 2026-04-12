import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const REGIONS = [
  'Eastern Province',
  'Western Province',
  'Northern Province',
  'Southern Province',
  'Kigali City',
];

type Tab = 'login' | 'signup';

export function FarmerAuthPage() {
  const [tab, setTab] = useState<Tab>('login');

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 flex flex-col">
      {/* ── Branding hero ── */}
      <div className="flex-shrink-0 px-6 pt-12 pb-6 text-center">
        <div className="text-5xl mb-3" aria-hidden="true">🌾</div>
        <h1 className="text-3xl font-bold text-white tracking-tight">AgriSmart</h1>
        <p className="text-green-200 mt-1 text-sm">Your personal farming companion</p>
      </div>

      {/* ── Card ── */}
      <div className="flex-1 bg-white rounded-t-3xl overflow-hidden flex flex-col">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-100">
          <TabBtn label="Sign In"       active={tab === 'login'}  onClick={() => setTab('login')} />
          <TabBtn label="Create Account" active={tab === 'signup'} onClick={() => setTab('signup')} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === 'login'  && <LoginForm  onSwitchTab={() => setTab('signup')} />}
          {tab === 'signup' && <SignupForm onSwitchTab={() => setTab('login')}  />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3.5 text-sm font-semibold transition-colors min-h-[44px] ${
        active
          ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const { login } = useAuthStore();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Incorrect phone number or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Welcome back. Sign in to continue.</p>

      <Field label="Phone number" id="login-phone">
        <input
          id="login-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+250 700 000 000"
          autoComplete="tel"
          required
          className={INPUT_CLS}
        />
      </Field>

      <Field label="Password" id="login-pwd">
        <div className="relative">
          <input
            id="login-pwd"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
            className={`${INPUT_CLS} pr-11`}
          />
          <PwdToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} />
        </div>
      </Field>

      {error && <ErrorBox message={error} />}

      <button type="submit" disabled={loading} className={PRIMARY_BTN}>
        {loading ? <Spinner /> : 'Sign In'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchTab} className="text-green-700 font-semibold hover:underline">
          Create one
        </button>
      </p>
    </form>
  );
}

// ─── Signup form ──────────────────────────────────────────────────────────────

function SignupForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const { register } = useAuthStore();
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [region, setRegion]           = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPwd) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        role: 'FARMER',
        location: { lat: 0, lng: 0, region },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Create your free AgriSmart account.</p>

      <Field label="Full name" id="su-name">
        <input
          id="su-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alice Uwase"
          autoComplete="name"
          required
          className={INPUT_CLS}
        />
      </Field>

      <Field label="Phone number" id="su-phone">
        <input
          id="su-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+250 700 000 000"
          autoComplete="tel"
          required
          className={INPUT_CLS}
        />
      </Field>

      <Field label="Region" id="su-region">
        <select
          id="su-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          required
          className={`${INPUT_CLS} bg-white`}
        >
          <option value="">Select your region…</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>

      <Field label="Password" id="su-pwd">
        <div className="relative">
          <input
            id="su-pwd"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
            className={`${INPUT_CLS} pr-11`}
          />
          <PwdToggle show={showPwd} onToggle={() => setShowPwd(v => !v)} />
        </div>
      </Field>

      <Field label="Confirm password" id="su-confirm">
        <div className="relative">
          <input
            id="su-confirm"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            required
            className={`${INPUT_CLS} pr-11`}
          />
          <PwdToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
        </div>
      </Field>

      {/* Password strength hint */}
      {password.length > 0 && (
        <PasswordStrength password={password} />
      )}

      {error && <ErrorBox message={error} />}

      <button type="submit" disabled={loading} className={PRIMARY_BTN}>
        {loading ? <Spinner /> : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchTab} className="text-green-700 font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─── Shared small components ──────────────────────────────────────────────────

function Field({
  label, id, children,
}: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function PwdToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
    >
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1 4.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532 3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 4.411m0 0L21 21" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      Please wait…
    </span>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'Weak',   color: 'bg-red-400' },
    { label: 'Fair',   color: 'bg-amber-400' },
    { label: 'Good',   color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-green-500' },
  ];
  const level = levels[Math.max(0, score - 1)];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors ${
              n <= score ? level.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Password strength: <span className="font-medium text-gray-600">{level.label}</span>
      </p>
    </div>
  );
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const INPUT_CLS =
  'w-full px-4 py-3 border border-gray-300 rounded-xl text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow';

const PRIMARY_BTN =
  'w-full py-3.5 bg-green-700 text-white rounded-xl font-semibold text-sm ' +
  'hover:bg-green-800 disabled:opacity-50 transition-colors min-h-[44px] ' +
  'flex items-center justify-center';
