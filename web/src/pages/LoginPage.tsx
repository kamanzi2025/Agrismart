import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ROLES = [
  { key: 'FARMER', label: 'Smallholder Bean Farmer', icon: '🌱' },
  { key: 'EXTENSION_OFFICER', label: 'Extension Officer', icon: '👨‍🌾' },
  { key: 'COOPERATIVE_LEADER', label: 'Cooperative Leader', icon: '🤝' },
  { key: 'ADMIN', label: 'System Administrator', icon: '⚙️' },
];

const REGIONS = [
  'Eastern Province', 'Western Province', 'Northern Province',
  'Southern Province', 'Kigali City',
];

const ROLE_COLORS: Record<string, string> = {
  FARMER: 'ring-green-500 border-green-500 bg-green-50',
  EXTENSION_OFFICER: 'ring-blue-500 border-blue-500 bg-blue-50',
  COOPERATIVE_LEADER: 'ring-orange-500 border-orange-500 bg-orange-50',
  ADMIN: 'ring-purple-500 border-purple-500 bg-purple-50',
};

function navigateByRole(role: string | undefined, navigate: (path: string) => void) {
  if (role === 'EXTENSION_OFFICER') navigate('/officer/dashboard');
  else if (role === 'COOPERATIVE_LEADER') navigate('/leader/overview');
  else if (role === 'ADMIN') navigate('/admin/dashboard');
  else navigate('/');
}

export function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Sign up state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [region, setRegion] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginPhone, loginPassword);
      const role = useAuthStore.getState().user?.role;
      if (role === 'FARMER') {
        useAuthStore.getState().logout();
        setLoginError('The web portal is for officers, leaders, and admins only. Farmers should use the AgriSmart mobile app.');
        return;
      }
      navigateByRole(role, navigate);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setLoginError(msg ?? 'Incorrect phone number or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!role) { setSignupError('Please select your role.'); return; }
    if (!region) { setSignupError('Please select your region.'); return; }
    if (password !== confirmPassword) { setSignupError('Passwords do not match.'); return; }
    if (password.length < 6) { setSignupError('Password must be at least 6 characters.'); return; }

    if (role === 'FARMER') {
      setSignupError('The web portal is for officers, leaders, and admins only. Farmers should use the AgriSmart mobile app.');
      return;
    }

    setSignupLoading(true);
    try {
      await register({
        name,
        phone,
        password,
        role,
        location: { lat: 0, lng: 0, region },
        farmSize: role === 'FARMER' && farmSize ? parseFloat(farmSize) : undefined,
      });
      navigateByRole(useAuthStore.getState().user?.role, navigate);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setSignupError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-green-800 px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-white">AgriSmart</h1>
          <p className="text-green-200 mt-1 text-sm">Advisory Platform for Bean Farmers</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'login'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === 'signup'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="px-8 py-6">
          {/* ── LOGIN TAB ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Welcome back. Sign in to your account.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="+250700000000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {loginError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium transition-colors"
              >
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <button type="button" onClick={() => setTab('signup')} className="text-green-700 font-medium hover:underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── SIGN UP TAB ── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Choose your role and fill in your details.</p>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all
                        ${role === r.key
                          ? `ring-2 ${ROLE_COLORS[r.key]}`
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <span className="text-xs font-semibold text-gray-800 leading-tight">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alice Uwase"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+250700000000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Select region…</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Farm size — only for farmers */}
              {role === 'FARMER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm size (hectares)</label>
                  <input
                    type="number"
                    value={farmSize}
                    onChange={e => setFarmSize(e.target.value)}
                    placeholder="e.g. 1.5"
                    min="0.1"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {signupError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{signupError}</p>
              )}

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium transition-colors"
              >
                {signupLoading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-green-700 font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
