import { useState } from 'react';

const LEVEL_TOKENS = {
  Critical: {
    label: 'Critical',
    hue: '#FF453A',
    glowFrom: '#FF6B6B',
    glowTo: '#FF453A',
    text: 'text-rose-600 dark:text-rose-300',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-200 border-rose-400/30'
  },
  High: {
    label: 'High',
    hue: '#FF9F0A',
    glowFrom: '#FFB661',
    glowTo: '#FF9F0A',
    text: 'text-amber-600 dark:text-amber-300',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-200 border-amber-400/30'
  },
  Medium: {
    label: 'Medium',
    hue: '#FFD60A',
    glowFrom: '#FFE066',
    glowTo: '#FFD60A',
    text: 'text-yellow-600 dark:text-yellow-300',
    badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-200 border-yellow-400/30'
  },
  Low: {
    label: 'Low',
    hue: '#30D158',
    glowFrom: '#65E590',
    glowTo: '#30D158',
    text: 'text-emerald-600 dark:text-emerald-300',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/30'
  }
};

function Gauge({ score, level }) {
  const max = 9;
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const dashOffset = c * (1 - pct);
  const tokens = LEVEL_TOKENS[level] || LEVEL_TOKENS.Low;
  const gradId = `gauge-${level || 'l'}`;
  const glowId = `glow-${level || 'l'}`;

  return (
    <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex-shrink-0">
      <svg viewBox="0 0 180 180" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tokens.glowFrom} />
            <stop offset="100%" stopColor={tokens.glowTo} />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer soft halo */}
        <circle cx="90" cy="90" r={r} fill="none" stroke={tokens.hue} strokeWidth="2" opacity="0.12" />

        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="12"
          stroke="currentColor"
          className="text-slate-900/[0.06] dark:text-white/[0.06]"
        />

        {/* Progress arc */}
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          stroke={`url(#${gradId})`}
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          filter={`url(#${glowId})`}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Specular highlight: top-left arc */}
        <path
          d="M 35 80 A 60 60 0 0 1 95 30"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`font-sans font-semibold text-5xl sm:text-[3.4rem] tabular leading-none tracking-tight ${tokens.text}`}>
          {score.toFixed(1)}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-medium">
          / {max}.0
        </span>
      </div>
    </div>
  );
}

function SubFactorRow({ label, reason, score }) {
  const barWidth = `${(score / 3) * 100}%`;
  let barClass = 'bg-emerald-500/70';
  if (score === 2) barClass = 'bg-amber-500/70';
  if (score === 3) barClass = 'bg-rose-500/70';

  return (
    <div className="py-2.5 first:pt-0 last:pb-0 border-b hairline last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium tracking-tight">{label}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{reason}</p>
        </div>
        <span className="font-mono text-[11px] tabular text-slate-500 dark:text-slate-400 whitespace-nowrap pt-1">
          {score}/3
        </span>
      </div>
      <div className="mt-2 h-[3px] rounded-full bg-slate-900/[0.06] dark:bg-white/[0.05] overflow-hidden">
        <div className={`h-full ${barClass} rounded-full transition-[width] duration-700`} style={{ width: barWidth }} />
      </div>
    </div>
  );
}

function Breakdown({ title, score, factors }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-inset rounded-2xl p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-medium">
            {title}
          </p>
          <p className="text-2xl font-semibold tabular tracking-tight mt-0.5">
            {score.toFixed(2)}
            <span className="text-sm text-slate-400 ml-1.5 font-normal">/ 3.0</span>
          </p>
        </div>
        <span className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-all duration-500 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">
          {Object.entries(factors).map(([key, f]) => (
            <SubFactorRow key={key} label={f.label} reason={f.reason} score={f.score} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskScoreCard({ result }) {
  const tokens = LEVEL_TOKENS[result.riskLevel] || LEVEL_TOKENS.Low;
  let hostname = result.url;
  try { hostname = new URL(result.url).hostname.replace(/^www\./, ''); } catch {}

  return (
    <div className="glass rounded-[28px] p-6 sm:p-8 overflow-hidden relative">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-7 sm:gap-9">
        <Gauge score={result.riskScore} level={result.riskLevel} />

        <div className="flex-1 w-full text-center md:text-left">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] border ${tokens.badge}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.hue }} />
            {tokens.label} risk
          </div>

          <h2 className="mt-3 font-sans text-2xl sm:text-3xl tracking-tight leading-tight">
            <span className="text-slate-500 dark:text-slate-400">A privacy risk of </span>
            <span className="font-serif italic" style={{ color: tokens.hue }}>{result.riskScore.toFixed(2)}</span>
            <span className="text-slate-500 dark:text-slate-400"> for </span>
            <br className="hidden sm:block" />
            <span className="font-mono text-base sm:text-lg text-slate-700 dark:text-slate-200 break-all">
              {hostname}
            </span>
          </h2>

          <div className="grid grid-cols-2 gap-3 mt-5 max-w-md mx-auto md:mx-0">
            <Breakdown
              title="Likelihood"
              score={result.likelihoodScore}
              factors={result.likelihoodFactors}
            />
            <Breakdown
              title="Impact"
              score={result.impactScore}
              factors={result.impactFactors}
            />
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
            Risk = Likelihood × Impact &nbsp;·&nbsp; OWASP RR
          </p>
        </div>
      </div>
    </div>
  );
}

export default RiskScoreCard;
