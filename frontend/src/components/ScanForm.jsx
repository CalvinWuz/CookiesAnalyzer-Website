import { useState } from 'react';

const CATEGORIES = [
  { value: 'news_media', label: 'News' },
  { value: 'government', label: 'Government' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'other', label: 'Other' }
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ScanForm({ onScan, loading, compact }) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('other');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    onScan({ url: normalized, category });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`glass rounded-[28px] ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-7'}`}
    >
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
          <SearchIcon />
        </div>
        <input
          id="url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com or https://..."
          aria-label="Website URL"
          className="glass-input w-full pl-12 pr-4 py-4 rounded-2xl text-base sm:text-lg tracking-tight"
          disabled={loading}
          autoComplete="off"
          required
        />
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-2.5 font-medium">
          Website category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              disabled={loading}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition disabled:opacity-50 ${
                category === c.value ? 'glass-pill--active' : 'glass-pill'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          We run three headless Chromium passes plus a rejection pass to surface trackers that ignore consent.
        </p>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary px-6 py-2.5 rounded-full text-sm font-semibold tracking-tight inline-flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
              Scanning
            </>
          ) : (
            <>Scan now</>
          )}
        </button>
      </div>
    </form>
  );
}

export default ScanForm;
