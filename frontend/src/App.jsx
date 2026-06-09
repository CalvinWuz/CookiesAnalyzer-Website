import { useState, useEffect } from 'react';
import axios from 'axios';
import ScanForm from './components/ScanForm.jsx';
import RiskScoreCard from './components/RiskScoreCard.jsx';
import CookieTable from './components/CookieTable.jsx';
import CompliancePanel from './components/CompliancePanel.jsx';
import ReportSummary from './components/ReportSummary.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function Logo({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="3" fill="url(#logo-grad)" />
      <circle cx="12" cy="12" r="6.25" stroke="url(#logo-grad)" strokeWidth="1.4" opacity="0.7" />
      <circle cx="12" cy="12" r="9.5" stroke="url(#logo-grad)" strokeWidth="1.4" opacity="0.35" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function AuroraBackdrop() {
  return (
    <>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob aurora-blob--violet" />
        <div className="aurora-blob aurora-blob--rose" />
        <div className="aurora-blob aurora-blob--cyan" />
      </div>
      <div className="noise-overlay" aria-hidden="true" />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      <div className="glass rounded-[28px] p-8 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-44 h-44 rounded-full bg-white/30 dark:bg-white/[0.03] relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="flex-1 w-full space-y-3">
            <div className="h-4 w-1/3 rounded-full bg-white/30 dark:bg-white/[0.03] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
            <div className="h-9 w-2/3 rounded-xl bg-white/30 dark:bg-white/[0.03] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="h-20 rounded-2xl bg-white/30 dark:bg-white/[0.03] relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
              <div className="h-20 rounded-2xl bg-white/30 dark:bg-white/[0.03] relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-slate-600/80 dark:text-slate-300/60 font-mono">
        Running 3 baseline scans + rejection pass · 30–90s
      </p>
    </div>
  );
}

function Hero({ visible }) {
  return (
    <section
      className={`text-center mb-10 sm:mb-14 transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden mb-0'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-4 font-medium">
        ISO 27005 · OWASP Risk Rating · GDPR · UU PDP
      </p>
      <h2 className="font-sans text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.05]">
        Measure the <span className="font-serif italic text-indigo-500 dark:text-indigo-300">privacy weight</span>
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        of any website.
      </h2>
      <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
        A multi-pass cookie audit that classifies trackers, scores risk on the OWASP rubric,
        and benchmarks regulatory compliance — in seconds.
      </p>
    </section>
  );
}

function App() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  async function handleScan({ url, category }) {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await axios.post(
        `${API_BASE}/scan`,
        { url, category },
        { timeout: 180000 }
      );
      setScanResult(response.data);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Scan failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadJSON() {
    if (!scanResult) return;
    const blob = new Blob([JSON.stringify(scanResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const hostname = (() => {
      try { return new URL(scanResult.url).hostname; }
      catch { return 'report'; }
    })();
    a.download = `cookierisk-${hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadPDF() {
    window.print();
  }

  const hasResult = !!scanResult;

  return (
    <div className="min-h-screen relative">
      <AuroraBackdrop />

      <header className="sticky top-0 z-30 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="glass rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-7 h-7" />
              <div className="leading-tight">
                <p className="text-sm sm:text-[15px] font-semibold tracking-tight">
                  Cookie<span className="font-serif italic font-normal text-indigo-500 dark:text-indigo-300">Risk</span> Analyzer
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="glass-pill w-9 h-9 rounded-full flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20">
        <div className="animate-fade-up">
          <Hero visible={!hasResult && !loading} />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <ScanForm onScan={handleScan} loading={loading} compact={hasResult} />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 glass rounded-3xl p-5 border-l-4 border-rose-500/80 dark:border-rose-400/70"
          >
            <p className="font-semibold text-rose-700 dark:text-rose-300">Scan failed</p>
            <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">{error}</p>
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {scanResult && (
          <div className="mt-8 space-y-5 sm:space-y-6">
            <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
              <RiskScoreCard result={scanResult} />
            </div>
            <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
              <ReportSummary result={scanResult} />
            </div>
            <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
              <CookieTable cookies={scanResult.cookies} />
            </div>
            <div className="animate-fade-up" style={{ animationDelay: '360ms' }}>
              <CompliancePanel compliance={scanResult.compliance} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2 print:hidden animate-fade-up" style={{ animationDelay: '480ms' }}>
              <button
                onClick={handleDownloadJSON}
                className="glass-pill px-5 py-2.5 rounded-full text-sm font-medium"
              >
                Download JSON
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn-primary px-5 py-2.5 rounded-full text-sm font-medium"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="pb-10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="border-t hairline pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <span className="font-serif italic text-sm">Cookie<span className="not-italic font-sans">Risk</span></span> Analyzer
            <span className="opacity-50"> · </span>
            ISO 27005 · OWASP Risk Rating Methodology
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
