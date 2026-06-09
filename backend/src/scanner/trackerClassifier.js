import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database tracker built-in: jaringan utama yang umum ditemui
// Prevalence kira-kira diambil dari publikasi DuckDuckGo Tracker Radar dan WhoTracks.Me
const KNOWN_TRACKERS = {
  'google-analytics.com': { category: 'analytics', owner: 'Google LLC', prevalence: 0.85 },
  'doubleclick.net': { category: 'advertising', owner: 'Google LLC', prevalence: 0.78 },
  'googletagmanager.com': { category: 'analytics', owner: 'Google LLC', prevalence: 0.72 },
  'googlesyndication.com': { category: 'advertising', owner: 'Google LLC', prevalence: 0.45 },
  'googleadservices.com': { category: 'advertising', owner: 'Google LLC', prevalence: 0.40 },
  'google.com': { category: 'advertising', owner: 'Google LLC', prevalence: 0.90 },
  'gstatic.com': { category: 'cdn', owner: 'Google LLC', prevalence: 0.65 },
  'youtube.com': { category: 'social media', owner: 'Google LLC', prevalence: 0.40 },
  'ytimg.com': { category: 'cdn', owner: 'Google LLC', prevalence: 0.35 },
  'facebook.com': { category: 'social media', owner: 'Meta Platforms', prevalence: 0.55 },
  'facebook.net': { category: 'social media', owner: 'Meta Platforms', prevalence: 0.40 },
  'fbcdn.net': { category: 'cdn', owner: 'Meta Platforms', prevalence: 0.35 },
  'instagram.com': { category: 'social media', owner: 'Meta Platforms', prevalence: 0.20 },
  'twitter.com': { category: 'social media', owner: 'X Corp', prevalence: 0.30 },
  'x.com': { category: 'social media', owner: 'X Corp', prevalence: 0.20 },
  't.co': { category: 'social media', owner: 'X Corp', prevalence: 0.15 },
  'tiktok.com': { category: 'social media', owner: 'ByteDance', prevalence: 0.25 },
  'linkedin.com': { category: 'social media', owner: 'Microsoft', prevalence: 0.20 },
  'pinterest.com': { category: 'social media', owner: 'Pinterest Inc', prevalence: 0.10 },
  'snapchat.com': { category: 'social media', owner: 'Snap Inc', prevalence: 0.05 },
  'reddit.com': { category: 'social media', owner: 'Reddit Inc', prevalence: 0.04 },
  'hotjar.com': { category: 'analytics', owner: 'Hotjar Ltd', prevalence: 0.18 },
  'clarity.ms': { category: 'analytics', owner: 'Microsoft', prevalence: 0.12 },
  'bing.com': { category: 'advertising', owner: 'Microsoft', prevalence: 0.15 },
  'adobe.com': { category: 'analytics', owner: 'Adobe Inc', prevalence: 0.20 },
  'omtrdc.net': { category: 'analytics', owner: 'Adobe Inc', prevalence: 0.12 },
  'demdex.net': { category: 'analytics', owner: 'Adobe Inc', prevalence: 0.10 },
  'everesttech.net': { category: 'advertising', owner: 'Adobe Inc', prevalence: 0.08 },
  'criteo.com': { category: 'advertising', owner: 'Criteo SA', prevalence: 0.22 },
  'criteo.net': { category: 'advertising', owner: 'Criteo SA', prevalence: 0.18 },
  'taboola.com': { category: 'advertising', owner: 'Taboola Inc', prevalence: 0.18 },
  'outbrain.com': { category: 'advertising', owner: 'Outbrain Inc', prevalence: 0.15 },
  'amazon-adsystem.com': { category: 'advertising', owner: 'Amazon', prevalence: 0.25 },
  'adsrvr.org': { category: 'advertising', owner: 'The Trade Desk', prevalence: 0.18 },
  'rubiconproject.com': { category: 'advertising', owner: 'Magnite', prevalence: 0.12 },
  'pubmatic.com': { category: 'advertising', owner: 'PubMatic', prevalence: 0.12 },
  'openx.net': { category: 'advertising', owner: 'OpenX', prevalence: 0.10 },
  'casalemedia.com': { category: 'advertising', owner: 'Index Exchange', prevalence: 0.10 },
  'adnxs.com': { category: 'advertising', owner: 'Xandr (Microsoft)', prevalence: 0.15 },
  'yahoo.com': { category: 'advertising', owner: 'Yahoo Inc', prevalence: 0.20 },
  'yimg.com': { category: 'cdn', owner: 'Yahoo Inc', prevalence: 0.12 },
  'segment.com': { category: 'analytics', owner: 'Twilio', prevalence: 0.15 },
  'segment.io': { category: 'analytics', owner: 'Twilio', prevalence: 0.10 },
  'mixpanel.com': { category: 'analytics', owner: 'Mixpanel Inc', prevalence: 0.08 },
  'amplitude.com': { category: 'analytics', owner: 'Amplitude Inc', prevalence: 0.07 },
  'fullstory.com': { category: 'analytics', owner: 'FullStory', prevalence: 0.05 },
  'newrelic.com': { category: 'analytics', owner: 'New Relic', prevalence: 0.07 },
  'datadoghq.com': { category: 'analytics', owner: 'Datadog', prevalence: 0.05 },
  'optimizely.com': { category: 'analytics', owner: 'Optimizely', prevalence: 0.05 },
  'hubspot.com': { category: 'analytics', owner: 'HubSpot', prevalence: 0.10 },
  'intercom.io': { category: 'analytics', owner: 'Intercom Inc', prevalence: 0.06 },
  'zendesk.com': { category: 'analytics', owner: 'Zendesk', prevalence: 0.08 },
  'mailchimp.com': { category: 'analytics', owner: 'Intuit', prevalence: 0.08 },
  'addthis.com': { category: 'social media', owner: 'Oracle', prevalence: 0.10 },
  'sharethis.com': { category: 'social media', owner: 'ShareThis', prevalence: 0.08 },
  'disqus.com': { category: 'social media', owner: 'Disqus', prevalence: 0.05 },
  'cloudflare.com': { category: 'cdn', owner: 'Cloudflare Inc', prevalence: 0.60 },
  'cloudfront.net': { category: 'cdn', owner: 'Amazon AWS', prevalence: 0.50 },
  'jsdelivr.net': { category: 'cdn', owner: 'jsDelivr', prevalence: 0.30 },
  'cdnjs.cloudflare.com': { category: 'cdn', owner: 'Cloudflare Inc', prevalence: 0.25 },
  'unpkg.com': { category: 'cdn', owner: 'Unpkg', prevalence: 0.15 },
  'akamaized.net': { category: 'cdn', owner: 'Akamai', prevalence: 0.20 },
  'fastly.net': { category: 'cdn', owner: 'Fastly', prevalence: 0.18 }
};

// Cache untuk lookup DDG Tracker Radar
const radarCache = new Map();
const TRACKER_RADAR_PATH = path.join(__dirname, '..', '..', 'tracker-radar', 'domains');
let radarAvailable = null;

async function isRadarAvailable() {
  if (radarAvailable !== null) return radarAvailable;
  try {
    await fs.access(TRACKER_RADAR_PATH);
    radarAvailable = true;
  } catch {
    radarAvailable = false;
  }
  return radarAvailable;
}

function mapDDGCategory(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return 'unknown';
  const joined = categories.join(' ').toLowerCase();
  if (/advertis|ad fraud|ad motivated/.test(joined)) return 'advertising';
  if (/analytic|audience|metric|tag manager|session replay/.test(joined)) return 'analytics';
  if (/social/.test(joined)) return 'social media';
  if (/cdn|content delivery|hosting/.test(joined)) return 'cdn';
  return 'unknown';
}

async function lookupRadar(domain) {
  if (radarCache.has(domain)) return radarCache.get(domain);
  if (!(await isRadarAvailable())) {
    radarCache.set(domain, null);
    return null;
  }

  // Cari di beberapa region prioritas
  const regions = ['US', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP', 'BR', 'ID'];
  for (const region of regions) {
    try {
      const filePath = path.join(TRACKER_RADAR_PATH, region, `${domain}.json`);
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const info = {
        category: mapDDGCategory(data.categories),
        owner: data.owner?.displayName || data.owner?.name || 'Unknown',
        prevalence: data.prevalence?.tracking ?? data.prevalence?.total ?? 0
      };
      radarCache.set(domain, info);
      return info;
    } catch {
      // try next region
    }
  }

  radarCache.set(domain, null);
  return null;
}

function extractRootDomain(domain) {
  if (!domain) return '';
  const cleaned = domain.replace(/^\./, '').toLowerCase();
  const parts = cleaned.split('.');
  if (parts.length <= 2) return cleaned;
  return parts.slice(-2).join('.');
}

function computeLifetime(cookie) {
  // Playwright: expires === -1 berarti session cookie
  if (cookie.expires === undefined || cookie.expires === null || cookie.expires === -1 || cookie.session) {
    return { isSession: true, lifetimeDays: 0 };
  }
  const expiresMs = cookie.expires * 1000;
  const nowMs = Date.now();
  const diffDays = Math.max(0, Math.round((expiresMs - nowMs) / (1000 * 60 * 60 * 24)));
  return { isSession: false, lifetimeDays: diffDays };
}

export async function classifyCookies(cookies) {
  const result = [];

  for (const cookie of cookies) {
    const rootDomain = extractRootDomain(cookie.domain);

    // Prioritas: built-in tracker DB -> DDG Tracker Radar -> Unknown
    let info = KNOWN_TRACKERS[rootDomain];
    if (!info) {
      info = await lookupRadar(rootDomain);
    }
    if (!info) {
      info = { category: 'unknown', owner: 'Unknown', prevalence: 0 };
    }

    const { isSession, lifetimeDays } = computeLifetime(cookie);

    result.push({
      name: cookie.name,
      domain: cookie.domain,
      path: cookie.path,
      expires: cookie.expires,
      lifetimeDays,
      isSession,
      sameSite: cookie.sameSite || 'None',
      secure: !!cookie.secure,
      httpOnly: !!cookie.httpOnly,
      isThirdParty: cookie.isThirdParty,
      persistsAfterRejection: cookie.persistsAfterRejection,
      category: info.category,
      owner: info.owner,
      prevalence: info.prevalence
    });
  }

  return result;
}
