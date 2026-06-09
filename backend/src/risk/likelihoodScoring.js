// Daftar root domain milik jaringan tracker yang sangat dikenal
const KNOWN_TRACKER_DOMAINS = [
  'google-analytics.com', 'doubleclick.net', 'googletagmanager.com',
  'googlesyndication.com', 'googleadservices.com',
  'facebook.com', 'facebook.net', 'fbcdn.net',
  'criteo.com', 'criteo.net',
  'taboola.com', 'outbrain.com',
  'amazon-adsystem.com', 'adnxs.com', 'adsrvr.org',
  'demdex.net', 'omtrdc.net',
  'hotjar.com', 'clarity.ms'
];

function isKnownTrackerDomain(cookieDomain) {
  const lower = cookieDomain.toLowerCase().replace(/^\./, '');
  return KNOWN_TRACKER_DOMAINS.some((td) => lower === td || lower.endsWith('.' + td));
}

export function scoreLikelihood(cookies) {
  // 1. Jumlah domain third-party
  const uniqueDomains = new Set(cookies.map((c) => c.domain.replace(/^\./, '').toLowerCase()));
  const domainCount = uniqueDomains.size;
  let domainCountScore = 1;
  if (domainCount >= 16) domainCountScore = 3;
  else if (domainCount >= 6) domainCountScore = 2;

  // 2. Kehadiran tracker network terkenal
  const knownTrackerCookies = cookies.filter((c) => isKnownTrackerDomain(c.domain));
  const knownDomainSet = new Set(knownTrackerCookies.map((c) => c.domain.replace(/^\./, '').toLowerCase()));
  let trackerScore = 1;
  if (knownDomainSet.size >= 3) trackerScore = 3;
  else if (knownDomainSet.size >= 1) trackerScore = 2;

  // 3. Persistensi cookie - lifetime maksimum
  const maxLifetime = cookies.length === 0
    ? 0
    : Math.max(...cookies.map((c) => (c.isSession ? 0 : c.lifetimeDays || 0)));
  let persistenceScore = 1;
  if (maxLifetime >= 30) persistenceScore = 3;
  else if (maxLifetime > 0) persistenceScore = 2;

  // 4. Cross-domain tracking behavior
  const advertisingCount = cookies.filter((c) => c.category === 'advertising').length;
  const persistAfterReject = cookies.filter((c) => c.persistsAfterRejection).length;
  let crossDomainScore = 1;
  if (advertisingCount >= 3 || persistAfterReject >= 5) crossDomainScore = 3;
  else if (advertisingCount >= 1 || persistAfterReject >= 1) crossDomainScore = 2;

  const subFactors = {
    domainCount: {
      score: domainCountScore,
      value: domainCount,
      label: 'Jumlah domain third-party',
      reason: `${domainCount} unique third-party domains detected (${domainCount <= 5 ? '1-5' : domainCount <= 15 ? '6-15' : '16+'} bracket).`
    },
    knownTrackers: {
      score: trackerScore,
      value: knownDomainSet.size,
      label: 'Tracker network terkenal',
      reason: knownDomainSet.size === 0
        ? 'No major tracker network cookies found.'
        : `${knownDomainSet.size} major tracker network(s) present: ${[...knownDomainSet].slice(0, 5).join(', ')}.`
    },
    persistence: {
      score: persistenceScore,
      value: maxLifetime,
      label: 'Persistensi cookie',
      reason: maxLifetime === 0
        ? 'All cookies are session-only.'
        : `Longest cookie lifetime is ${maxLifetime} day(s) (${maxLifetime < 30 ? '<30 day' : '30+ day'} bracket).`
    },
    crossDomain: {
      score: crossDomainScore,
      value: { advertisingCount, persistAfterReject },
      label: 'Cross-domain tracking',
      reason: `${advertisingCount} advertising tracker(s); ${persistAfterReject} cookie(s) persist after rejection.`
    }
  };

  const total = domainCountScore + trackerScore + persistenceScore + crossDomainScore;
  const score = total / 4;

  return {
    score: parseFloat(score.toFixed(2)),
    subFactors
  };
}
