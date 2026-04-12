import { useState, useEffect } from 'react';

// ─── Types (SRS §5.4) ─────────────────────────────────────────────────────────

type EntryType = 'INCOME' | 'EXPENSE';

interface FinanceEntry {
  id: string;
  type: EntryType;
  label: string;
  amount: number;
  category: string;
  timestamp: string;
}

// ─── Categories (SRS FF-03, FF-04) ───────────────────────────────────────────

const INCOME_CATEGORIES  = ['Crops sold', 'Livestock', 'Other'] as const;
const EXPENSE_CATEGORIES = ['Seeds', 'Fertilizer', 'Labour', 'Equipment', 'Transport', 'Other'] as const;

// ─── localStorage (SRS FF-12, §5.4) ──────────────────────────────────────────

const LS_KEY = 'agrismart_finance';

function loadEntries(): FinanceEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as FinanceEntry[]) : [];
  } catch { return []; }
}

function saveEntries(entries: FinanceEntry[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // Private browsing or storage full — entries won't persist
  }
}

function storageAvailable(): boolean {
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return true;
  } catch { return false; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRWF = (n: number) =>
  new Intl.NumberFormat('en-RW').format(Math.round(n)) + ' RWF';

function generateId(): string {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinancePage() {
  const [entries, setEntries]     = useState<FinanceEntry[]>(() => loadEntries());
  const [activeForm, setActiveForm] = useState<EntryType>('EXPENSE');
  const [label, setLabel]         = useState('');
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState('');
  const [formError, setFormError] = useState('');
  const noStorage                 = !storageAvailable();

  // Persist on every change
  useEffect(() => { saveEntries(entries); }, [entries]);

  const categories = activeForm === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const resetForm = () => { setLabel(''); setAmount(''); setCategory(''); setFormError(''); };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!label.trim())       { setFormError('Description is required.'); return; }
    if (!amount || isNaN(amt) || amt <= 0) { setFormError('Enter a valid amount greater than 0.'); return; }
    if (!category)           { setFormError('Please select a category.'); return; }

    const newEntry: FinanceEntry = {
      id: generateId(),
      type: activeForm,
      label: label.trim(),
      amount: amt,
      category,
      timestamp: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // ── Derived totals (SRS FF-05) ──
  const totalIncome  = entries.filter(e => e.type === 'INCOME') .reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
  const netProfit    = totalIncome - totalExpense;

  // ── Expense breakdown by category (SRS FF-07, FF-08) ──
  const expenseByCategory = EXPENSE_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = entries
      .filter(e => e.type === 'EXPENSE' && e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});
  const categoriesWithSpend = Object.entries(expenseByCategory).filter(([, v]) => v > 0);

  // ── Proportional bar base (SRS FF-10) ──
  const maxEntry = entries.length ? Math.max(...entries.map(e => e.amount)) : 1;

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── Storage unavailable warning (SRS §5.4) ── */}
      {noStorage && (
        <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          Storage is unavailable (private browsing mode). Entries will not be saved between sessions.
        </div>
      )}

      {/* ── Summary panel (SRS FF-05, FF-06) ── */}
      <section aria-label="Financial summary" className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Farm Finance Summary</h2>
        <div className="grid grid-cols-3 gap-2">
          <SummaryTile label="Income" value={formatRWF(totalIncome)}  color="text-green-700" bg="bg-green-50" />
          <SummaryTile label="Expenses" value={formatRWF(totalExpense)} color="text-red-600"   bg="bg-red-50" />
          <SummaryTile
            label="Net Profit"
            value={formatRWF(Math.abs(netProfit))}
            prefix={netProfit < 0 ? '−' : netProfit > 0 ? '+' : ''}
            color={netProfit >= 0 ? 'text-green-700' : 'text-red-600'}
            bg={netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}
          />
        </div>
        <div className={`text-center text-sm font-semibold py-2 rounded-lg ${
          netProfit > 0 ? 'bg-green-100 text-green-800' :
          netProfit < 0 ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          {netProfit > 0 ? 'Profit' : netProfit < 0 ? 'Loss' : 'Breaking even'}
        </div>
      </section>

      {/* ── Expense breakdown (SRS FF-07, FF-08) ── */}
      {categoriesWithSpend.length > 0 && (
        <section aria-label="Expense breakdown by category" className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Expense Breakdown</h3>
          {categoriesWithSpend
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amount]) => {
              const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="font-medium">{cat}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="presentation">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                      aria-label={`${cat}: ${pct}% of total expenses`}
                    />
                  </div>
                </div>
              );
            })}
        </section>
      )}

      {/* ── Add entry form (SRS FF-01, FF-02) ── */}
      <section aria-label="Add income or expense" className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {(['INCOME', 'EXPENSE'] as EntryType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setActiveForm(t); resetForm(); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors min-h-[44px] ${
                activeForm === t
                  ? t === 'INCOME'
                    ? 'bg-green-700 text-white'
                    : 'bg-red-500 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t === 'INCOME' ? '+ Income' : '− Expense'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          {/* Description */}
          <div>
            <label htmlFor="fin-label" className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              id="fin-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={activeForm === 'INCOME' ? 'e.g. Beans sold' : 'e.g. Fertilizer purchase'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="fin-amount" className="block text-xs font-medium text-gray-600 mb-1">Amount (RWF)</label>
            <input
              id="fin-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 12000"
              min="1"
              step="any"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="fin-category" className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              id="fin-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {formError && (
            <p role="alert" className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors min-h-[44px] ${
              activeForm === 'INCOME' ? 'bg-green-700 hover:bg-green-800' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Add {activeForm === 'INCOME' ? 'Income' : 'Expense'}
          </button>
        </form>
      </section>

      {/* ── Entry list (SRS FF-09, FF-10, FF-11) ── */}
      {entries.length > 0 && (
        <section aria-label="Transaction history">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">All Entries</h3>
          <ul className="space-y-2">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                maxAmount={maxEntry}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📒</div>
          <p className="text-sm">No entries yet. Add your first income or expense above.</p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryTile({
  label, value, prefix = '', color, bg,
}: {
  label: string; value: string; prefix?: string; color: string; bg: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${bg} flex flex-col items-center text-center gap-0.5`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-bold ${color} leading-tight`}>{prefix}{value}</span>
    </div>
  );
}

function EntryCard({
  entry, maxAmount, onDelete,
}: {
  entry: FinanceEntry; maxAmount: number; onDelete: () => void;
}) {
  const isIncome = entry.type === 'INCOME';
  const barPct   = maxAmount > 0 ? (entry.amount / maxAmount) * 100 : 0;
  const date     = new Date(entry.timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });

  return (
    <li className="bg-white border border-gray-200 rounded-2xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}
            >
              {isIncome ? 'Income' : 'Expense'}
            </span>
            <span className="text-xs text-gray-400">{entry.category}</span>
          </div>
          <p className="text-sm font-medium text-gray-800 mt-1 truncate">{entry.label}</p>
          <p className={`text-sm font-bold mt-0.5 ${isIncome ? 'text-green-700' : 'text-red-600'}`}>
            {isIncome ? '+' : '−'} {formatRWF(entry.amount)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        {/* Delete (FF-11) */}
        <button
          onClick={onDelete}
          aria-label={`Delete entry: ${entry.label}`}
          className="text-gray-300 hover:text-red-500 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5-4h4a1 1 0 0 1 1 1v1H9V4a1 1 0 0 1 1-1zm-7 4h14" />
          </svg>
        </button>
      </div>
      {/* Proportional bar (FF-10) */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden" role="presentation">
        <div
          className={`h-full rounded-full transition-all ${isIncome ? 'bg-green-500' : 'bg-red-400'}`}
          style={{ width: `${barPct}%` }}
          aria-label={`${Math.round(barPct)}% of largest entry`}
        />
      </div>
    </li>
  );
}
