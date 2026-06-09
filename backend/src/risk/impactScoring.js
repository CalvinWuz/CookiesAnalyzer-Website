// Mapping kategori website ke skor sensitivitas (1-3) sesuai spek
// Government/Education = 1, E-Commerce/News = 2, Healthcare = 3
const CATEGORY_SENSITIVITY = {
  government: { score: 1, label: 'Government' },
  education: { score: 1, label: 'Education' },
  ecommerce: { score: 2, label: 'E-Commerce' },
  'e-commerce': { score: 2, label: 'E-Commerce' },
  news_media: { score: 2, label: 'News Media' },
  healthcare: { score: 3, label: 'Healthcare' },
  other: { score: 1, label: 'Other' }
};

function determineDataTypes(cookies) {
  const hasAdvertising = cookies.some((c) => c.category === 'advertising');
  const hasAnalytics = cookies.some((c) => c.category === 'analytics');
  const hasSocial = cookies.some((c) => c.category === 'social media');

  // Heuristik: advertising + (analytics atau social) menandakan profiling demografis/lokasi
  if (hasAdvertising && (hasAnalytics || hasSocial)) {
    return {
      score: 3,
      label: 'Demographic + Location',
      reason: 'Advertising cookies combined with analytics/social trackers suggest demographic and location profiling.'
    };
  }

  if (hasAnalytics || hasAdvertising) {
    return {
      score: 2,
      label: 'Behavioral',
      reason: 'Analytics or advertising cookies indicate behavioral data collection (clicks, page views, sessions).'
    };
  }

  return {
    score: 1,
    label: 'Session only',
    reason: 'Only session-level data appears to be collected.'
  };
}

function estimateExposureScale(cookies) {
  if (cookies.length === 0) {
    return { score: 1, label: 'Low traffic exposure', value: 0 };
  }

  // Skala eksposur didasarkan pada prevalensi tracker (proxy untuk traffic scale)
  // Tracker dengan prevalensi tinggi biasanya digunakan oleh situs traffic tinggi
  const avgPrevalence = cookies.reduce((sum, c) => sum + (c.prevalence || 0), 0) / cookies.length;
  const maxPrevalence = Math.max(...cookies.map((c) => c.prevalence || 0));

  if (maxPrevalence >= 0.5 || avgPrevalence >= 0.3 || cookies.length >= 25) {
    return {
      score: 3,
      label: 'High traffic exposure',
      value: parseFloat(avgPrevalence.toFixed(3))
    };
  }
  if (maxPrevalence >= 0.2 || avgPrevalence >= 0.1 || cookies.length >= 10) {
    return {
      score: 2,
      label: 'Medium traffic exposure',
      value: parseFloat(avgPrevalence.toFixed(3))
    };
  }
  return {
    score: 1,
    label: 'Low traffic exposure',
    value: parseFloat(avgPrevalence.toFixed(3))
  };
}

function scorePrivacyViolation(cookies, scanData) {
  const persistAfterReject = cookies.filter((c) => c.persistsAfterRejection).length;
  const sensitiveTrackers = cookies.filter(
    (c) => c.category === 'advertising' || c.category === 'social media'
  ).length;
  const noConsentMechanism = !scanData.metadata.consentBannerDetected;

  if (persistAfterReject >= 5 || sensitiveTrackers >= 10 || (noConsentMechanism && sensitiveTrackers >= 5)) {
    return {
      score: 3,
      label: 'Widespread violation',
      reason: `${persistAfterReject} cookies persist post-rejection; ${sensitiveTrackers} sensitive trackers active.`
    };
  }
  if (persistAfterReject >= 1 || sensitiveTrackers >= 3 || noConsentMechanism) {
    return {
      score: 2,
      label: 'Moderate violation',
      reason: `Some privacy-impacting behavior detected (${sensitiveTrackers} sensitive trackers).`
    };
  }
  return {
    score: 1,
    label: 'Minimal violation',
    reason: 'No significant privacy violations detected.'
  };
}

export function scoreImpact(cookies, category, scanData) {
  const dataType = determineDataTypes(cookies);
  const exposure = estimateExposureScale(cookies);
  const sensitivity = CATEGORY_SENSITIVITY[category?.toLowerCase()] || CATEGORY_SENSITIVITY.other;
  const violation = scorePrivacyViolation(cookies, scanData);

  const subFactors = {
    dataType: {
      score: dataType.score,
      value: dataType.label,
      label: 'Jenis data yang dikumpulkan',
      reason: dataType.reason
    },
    exposureScale: {
      score: exposure.score,
      value: exposure.value,
      label: 'Skala eksposur pengguna',
      reason: `${exposure.label} (avg tracker prevalence ${(exposure.value * 100).toFixed(1)}%, ${cookies.length} cookies).`
    },
    categorySensitivity: {
      score: sensitivity.score,
      value: sensitivity.label,
      label: 'Sensitivitas kategori website',
      reason: `${sensitivity.label} category mapped to sensitivity level ${sensitivity.score}/3.`
    },
    violationLevel: {
      score: violation.score,
      value: violation.label,
      label: 'Tingkat pelanggaran privasi (OWASP)',
      reason: violation.reason
    }
  };

  const total = dataType.score + exposure.score + sensitivity.score + violation.score;
  const score = total / 4;

  return {
    score: parseFloat(score.toFixed(2)),
    subFactors
  };
}
