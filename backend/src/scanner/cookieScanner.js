import { chromium } from 'playwright';

const SCAN_ITERATIONS = 3;
const PAGE_TIMEOUT_MS = 30000;
const WAIT_AFTER_LOAD_MS = 2000;
const WAIT_AFTER_REJECT_MS = 5000;

// Selektor umum untuk tombol penolakan consent
const REJECT_SELECTORS = [
  'button:has-text("Reject all")',
  'button:has-text("Reject All")',
  'button:has-text("Reject")',
  'button:has-text("Decline all")',
  'button:has-text("Decline")',
  'button:has-text("Refuse all")',
  'button:has-text("Refuse")',
  'button:has-text("Tolak")',
  'button:has-text("Tolak Semua")',
  'button:has-text("Tidak Setuju")',
  '[aria-label*="reject" i]',
  '[id*="reject" i]:not(input)',
  '[data-testid*="reject" i]',
  '[class*="reject" i]:not(input)'
];

// Selektor untuk tombol accept (untuk deteksi keberadaan banner)
const ACCEPT_SELECTORS = [
  'button:has-text("Accept all")',
  'button:has-text("Accept All")',
  'button:has-text("Accept")',
  'button:has-text("I agree")',
  'button:has-text("Setuju")',
  'button:has-text("Terima")',
  '[id*="accept" i]:not(input)',
  '[data-testid*="accept" i]'
];

function getRootDomain(hostname) {
  if (!hostname) return '';
  const cleaned = hostname.replace(/^\./, '').replace(/^www\./, '');
  const parts = cleaned.split('.');
  if (parts.length <= 2) return cleaned;
  return parts.slice(-2).join('.');
}

async function findFirstElement(page, selectors) {
  for (const sel of selectors) {
    try {
      const elem = await page.$(sel);
      if (elem) {
        const visible = await elem.isVisible().catch(() => false);
        if (visible) return { elem, selector: sel };
      }
    } catch {
      // ignore selector errors
    }
  }
  return null;
}

async function detectPrivacyPolicy(page) {
  try {
    const found = await page.$$eval('a', (links) =>
      links.some((a) => {
        const text = (a.textContent || '').toLowerCase();
        const href = (a.getAttribute('href') || '').toLowerCase();
        return /privacy|policy|kebijakan privasi/.test(text) ||
               /privacy|policy|kebijakan-privasi/.test(href);
      })
    );
    return found;
  } catch {
    return false;
  }
}

async function singleScan(url, options = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    bypassCSP: true
  });

  await context.clearCookies();

  const page = await context.newPage();
  const result = {
    primaryDomain: getRootDomain(new URL(url).hostname),
    baselineCookies: [],
    finalCookies: [],
    consentBannerDetected: false,
    rejectionSuccessful: false,
    privacyPolicyFound: false,
    loadError: null
  };

  try {
    await page.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT_MS });
    await page.waitForLoadState('networkidle', { timeout: PAGE_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(WAIT_AFTER_LOAD_MS);

    // Snapshot baseline cookies sebelum interaksi apa pun
    result.baselineCookies = await context.cookies();

    // Deteksi banner consent
    const rejectMatch = await findFirstElement(page, REJECT_SELECTORS);
    const acceptMatch = await findFirstElement(page, ACCEPT_SELECTORS);
    result.consentBannerDetected = !!(rejectMatch || acceptMatch);

    // Cek privacy policy
    result.privacyPolicyFound = await detectPrivacyPolicy(page);

    // Coba klik tombol reject jika diminta
    if (options.rejectConsent && rejectMatch) {
      try {
        await rejectMatch.elem.click({ timeout: 5000 });
        await page.waitForTimeout(WAIT_AFTER_REJECT_MS);
        result.rejectionSuccessful = true;
      } catch (e) {
        // Klik gagal, lanjut saja
      }
    }

    result.finalCookies = await context.cookies();
  } catch (err) {
    result.loadError = err.message;
    // Tetap kumpulkan cookies yang sudah ter-set
    try {
      result.baselineCookies = await context.cookies();
      result.finalCookies = result.baselineCookies;
    } catch {}
  } finally {
    await browser.close().catch(() => {});
  }

  return result;
}

export async function scanWebsite(url) {
  const primaryDomain = getRootDomain(new URL(url).hostname);

  // Phase 1: 3x baseline scan (tanpa interaksi)
  const baselineRuns = [];
  for (let i = 0; i < SCAN_ITERATIONS; i++) {
    const run = await singleScan(url, { rejectConsent: false });
    baselineRuns.push(run);
  }

  // Phase 2: scan dengan attempt untuk reject consent
  const rejectionRun = await singleScan(url, { rejectConsent: true });

  // Gabungkan cookies unik dari semua iterasi baseline
  const cookieMap = new Map();
  for (const run of baselineRuns) {
    for (const c of run.baselineCookies) {
      const key = `${c.name}|${c.domain}|${c.path}`;
      if (!cookieMap.has(key)) cookieMap.set(key, c);
    }
  }

  // Buat set cookies yang masih ada setelah rejection
  const rejectedKeys = new Set(
    rejectionRun.finalCookies.map((c) => `${c.name}|${c.domain}|${c.path}`)
  );

  // Tandai third-party dan persistence after rejection
  const allCookies = Array.from(cookieMap.values()).map((c) => {
    const key = `${c.name}|${c.domain}|${c.path}`;
    const cookieRoot = getRootDomain(c.domain);
    return {
      ...c,
      isThirdParty: cookieRoot !== primaryDomain && cookieRoot !== '',
      persistsAfterRejection: rejectedKeys.has(key)
    };
  });

  const thirdPartyCookies = allCookies.filter((c) => c.isThirdParty);

  // Konsolidasi metadata dari semua iterasi (paling permisif)
  const consentBannerDetected = baselineRuns.some((r) => r.consentBannerDetected);
  const privacyPolicyFound = baselineRuns.some((r) => r.privacyPolicyFound);

  return {
    cookies: thirdPartyCookies,
    allCookies,
    metadata: {
      primaryDomain,
      iterations: SCAN_ITERATIONS,
      totalCookies: allCookies.length,
      thirdPartyCount: thirdPartyCookies.length,
      consentBannerDetected,
      privacyPolicyFound,
      rejectionAttempted: rejectionRun.consentBannerDetected,
      rejectionSuccessful: rejectionRun.rejectionSuccessful,
      loadErrors: baselineRuns.filter((r) => r.loadError).map((r) => r.loadError)
    }
  };
}
