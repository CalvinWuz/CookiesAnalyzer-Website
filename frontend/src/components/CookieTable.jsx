import { useState, useMemo } from 'react';

const CATEGORY_HUES = {
  advertising: '#F43F5E',
  analytics: '#F59E0B',
  'social media': '#8B5CF6',
  cdn: '#06B6D4',
  unknown: '#94A3B8'
};

function CategoryDot({ category }) {
  const hue = CATEGORY_HUES[category] || CATEGORY_HUES.unknown;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium capitalize"
      style={{ color: hue }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hue }} />
      {category}
    </span>
  );
}

function CookieTable({ cookies }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const set = new Set(cookies.map((c) => c.category));
    return ['all', ...Array.from(set).sort()];
  }, [cookies]);

  const filtered = useMemo(() => {
    return cookies.filter((c) => {
      if (filter !== 'all' && c.category !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q) ||
          (c.owner || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cookies, filter, search]);

  return (
    <div className="glass rounded-[28px] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <h2 className="font-sans text-xl sm:text-2xl tracking-tight">
          Cookie <span className="font-serif italic font-normal text-indigo-500 dark:text-indigo-300">details</span>
          <span className="text-slate-400 font-mono text-sm ml-2 tabular">{cookies.length}</span>
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, domain, owner…"
          className="glass-input px-4 py-2 rounded-full text-sm w-full sm:w-72"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {categories.map((c) => {
          const count = c === 'all' ? cookies.length : cookies.filter((x) => x.category === c).length;
          const isActive = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${
                isActive ? 'glass-pill--active' : 'glass-pill'
              }`}
            >
              {c}
              <span className={`ml-1.5 font-mono tabular ${isActive ? 'opacity-60' : 'opacity-50'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-medium">
              <th className="text-left py-2.5 pr-3 font-medium">Name</th>
              <th className="text-left py-2.5 pr-3 font-medium">Domain</th>
              <th className="text-left py-2.5 pr-3 font-medium">Category</th>
              <th className="text-left py-2.5 pr-3 font-medium">Owner</th>
              <th className="text-left py-2.5 pr-3 font-medium">Lifetime</th>
              <th className="text-left py-2.5 pr-3 font-medium">SameSite</th>
              <th className="text-center py-2.5 pr-3 font-medium">Secure</th>
              <th className="text-left py-2.5 font-medium">After reject</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr
                key={`${c.name}|${c.domain}|${idx}`}
                className="border-t hairline hover:bg-white/30 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2.5 pr-3 font-mono text-xs break-all max-w-[160px]">{c.name}</td>
                <td className="py-2.5 pr-3 font-mono text-xs break-all max-w-[200px] text-slate-600 dark:text-slate-300">
                  {c.domain}
                </td>
                <td className="py-2.5 pr-3"><CategoryDot category={c.category} /></td>
                <td className="py-2.5 pr-3 text-xs text-slate-600 dark:text-slate-300">{c.owner}</td>
                <td className="py-2.5 pr-3 text-xs font-mono tabular whitespace-nowrap">
                  {c.isSession ? <span className="text-slate-500">Session</span> : `${c.lifetimeDays}d`}
                </td>
                <td className="py-2.5 pr-3 text-xs">{c.sameSite}</td>
                <td className="py-2.5 pr-3 text-xs text-center">
                  {c.secure ? (
                    <span className="text-emerald-600 dark:text-emerald-400">●</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">○</span>
                  )}
                </td>
                <td className="py-2.5 text-xs whitespace-nowrap">
                  {c.persistsAfterRejection ? (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Still active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Stopped
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500 dark:text-slate-400 italic font-serif text-lg">
                  No cookies match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CookieTable;
