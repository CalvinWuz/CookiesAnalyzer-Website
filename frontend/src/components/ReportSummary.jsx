import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_HUES = {
  advertising: '#F43F5E',
  analytics: '#F59E0B',
  'social media': '#8B5CF6',
  cdn: '#06B6D4',
  unknown: '#94A3B8'
};

const PRIORITY_STYLES = {
  High: 'bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-400/30',
  Medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-400/30',
  Low: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-400/20'
};

function Stat({ label, value, hue }) {
  return (
    <div className="glass-inset rounded-2xl p-4 relative overflow-hidden">
      {hue && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
          style={{ background: `linear-gradient(90deg, transparent, ${hue}, transparent)` }}
        />
      )}
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-medium">
        {label}
      </p>
      <p
        className="text-2xl sm:text-[28px] font-semibold tabular tracking-tight mt-1"
        style={hue ? { color: hue } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function CategoryBar({ name, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const hue = CATEGORY_HUES[name] || CATEGORY_HUES.unknown;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <span className="w-2 h-2 rounded-full" style={{ background: hue }} />
        <span className="text-sm capitalize tracking-tight">{name}</span>
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-slate-900/[0.06] dark:bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: hue }}
        />
      </div>
      <span className="text-xs font-mono tabular text-slate-500 dark:text-slate-400 w-8 text-right">
        {count}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      <span className="capitalize font-medium">{d.name}</span>
      <span className="ml-2 font-mono text-slate-500 dark:text-slate-400">{d.value}</span>
    </div>
  );
}

function Recommendation({ rec }) {
  return (
    <div className="glass-inset rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
            PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Low
          }`}
        >
          {rec.priority}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm tracking-tight">{rec.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {rec.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportSummary({ result }) {
  const cookies = result.cookies || [];
  const breakdown = cookies.reduce((acc, c) => {
    const cat = c.category || 'unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  const persistAfter = cookies.filter((c) => c.persistsAfterRejection).length;
  const uniqueDomains = new Set(cookies.map((c) => c.domain)).size;
  const total = cookies.length;

  return (
    <div className="glass rounded-[28px] p-6 sm:p-8">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-sans text-xl sm:text-2xl tracking-tight">
          Cookie <span className="font-serif italic font-normal text-indigo-500 dark:text-indigo-300">overview</span>
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular">
          {total} cookies · {uniqueDomains} domains
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Third-party" value={total} />
        <Stat label="Unique domains" value={uniqueDomains} />
        <Stat
          label="Persist after reject"
          value={persistAfter}
          hue={persistAfter > 0 ? '#FF453A' : undefined}
        />
        <Stat
          label="Consent banner"
          value={result.scanMetadata?.consentBannerDetected ? 'Yes' : 'No'}
          hue={!result.scanMetadata?.consentBannerDetected ? '#FF9F0A' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-1">
          {chartData.length > 0 ? (
            chartData
              .sort((a, b) => b.value - a.value)
              .map((entry) => (
                <CategoryBar
                  key={entry.name}
                  name={entry.name}
                  count={entry.value}
                  total={total}
                />
              ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic font-serif text-lg">
              No third-party cookies detected.
            </p>
          )}
        </div>

        <div className="h-56 sm:h-64 relative">
          {chartData.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={CATEGORY_HUES[entry.name] || CATEGORY_HUES.unknown} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Total
                </p>
                <p className="text-3xl font-semibold tabular tracking-tight">{total}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {result.recommendations && result.recommendations.length > 0 && (
        <div className="mt-7 pt-6 border-t hairline">
          <h3 className="font-sans text-base font-medium tracking-tight mb-3">
            Recommendations <span className="text-slate-400 font-mono text-xs ml-1">{result.recommendations.length}</span>
          </h3>
          <div className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <Recommendation key={idx} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportSummary;
