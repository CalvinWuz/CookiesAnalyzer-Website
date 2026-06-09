const STATUS_TOKENS = {
  compliant: {
    label: 'Compliant',
    hue: '#30D158',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  partial: {
    label: 'Partial',
    hue: '#FF9F0A',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300'
  },
  'non-compliant': {
    label: 'Non-compliant',
    hue: '#FF453A',
    dot: 'bg-rose-500',
    text: 'text-rose-700 dark:text-rose-300'
  }
};

function ScoreRing({ score, label }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 100));
  const dashOffset = c * (1 - pct);
  let hue = '#FF453A';
  if (score >= 75) hue = '#30D158';
  else if (score >= 50) hue = '#FF9F0A';

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-900/[0.06] dark:text-white/[0.06]" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={hue}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-sm tabular">
        {score}
      </div>
    </div>
  );
}

function IndicatorItem({ indicator }) {
  const t = STATUS_TOKENS[indicator.status] || STATUS_TOKENS.partial;
  return (
    <li className="glass-inset rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 mt-1">
          <span className={`block w-2.5 h-2.5 rounded-full ${t.dot} ring-4 ring-white/40 dark:ring-white/[0.04]`} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium tracking-tight">{indicator.name}</p>
            {indicator.article && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {indicator.article}
              </span>
            )}
          </div>
          <p className={`text-[11px] uppercase tracking-[0.16em] font-medium mt-1 ${t.text}`}>
            {t.label}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {indicator.description}
          </p>
        </div>
      </div>
    </li>
  );
}

function FrameworkSection({ title, data, accent }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <ScoreRing score={data.overallScore} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-medium">
            {accent}
          </p>
          <h3 className="font-sans text-lg sm:text-xl font-medium tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{data.summary}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {data.indicators.map((ind, idx) => (
          <IndicatorItem key={idx} indicator={ind} />
        ))}
      </ul>
    </div>
  );
}

function CompliancePanel({ compliance }) {
  return (
    <div className="glass rounded-[28px] p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="font-sans text-xl sm:text-2xl tracking-tight">
          Regulatory <span className="font-serif italic font-normal text-indigo-500 dark:text-indigo-300">compliance</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cross-checked against the two frameworks that govern cookie consent in the EU and Indonesia.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FrameworkSection title="GDPR" accent="Europe" data={compliance.gdpr} />
        <FrameworkSection title="UU PDP No. 27/2022" accent="Indonesia" data={compliance.uupdp} />
      </div>
    </div>
  );
}

export default CompliancePanel;
