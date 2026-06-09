// GDPR compliance indicators berdasarkan Articles 5, 6, 7, 13
export function checkGDPR(scanData, cookies) {
  const meta = scanData.metadata;
  const indicators = [];

  // 1. Valid cookie consent mechanism (Art. 7 GDPR)
  indicators.push({
    name: 'Cookie consent mechanism',
    article: 'GDPR Art. 7',
    status: meta.consentBannerDetected ? 'compliant' : 'non-compliant',
    description: meta.consentBannerDetected
      ? 'Consent banner detected on initial page load.'
      : 'No consent banner detected. GDPR Art. 7 requires demonstrable, freely-given consent before non-essential tracking.'
  });

  // 2. Accessible privacy policy (Art. 13)
  indicators.push({
    name: 'Accessible privacy policy',
    article: 'GDPR Art. 13',
    status: meta.privacyPolicyFound ? 'compliant' : 'non-compliant',
    description: meta.privacyPolicyFound
      ? 'Privacy policy link is discoverable on the landing page.'
      : 'No privacy policy link found. GDPR Art. 13 requires upfront information about processing.'
  });

  // 3. Rejection effectively stops tracking (Art. 7(3))
  const persistCount = cookies.filter((c) => c.persistsAfterRejection).length;
  let rejectionStatus;
  let rejectionDesc;
  if (!meta.consentBannerDetected) {
    rejectionStatus = 'non-compliant';
    rejectionDesc = 'No rejection mechanism available because no consent banner was detected.';
  } else if (!meta.rejectionSuccessful) {
    rejectionStatus = 'partial';
    rejectionDesc = 'Consent banner exists but could not be programmatically rejected; verify reject button is functional.';
  } else if (persistCount === 0) {
    rejectionStatus = 'compliant';
    rejectionDesc = 'No tracking cookies persisted after rejection.';
  } else if (persistCount <= 5) {
    rejectionStatus = 'partial';
    rejectionDesc = `${persistCount} cookie(s) still active after rejection - some tracking continues despite opt-out.`;
  } else {
    rejectionStatus = 'non-compliant';
    rejectionDesc = `${persistCount} cookie(s) persist after rejection. Violates Art. 7(3) - withdrawing consent must be as easy as giving it.`;
  }
  indicators.push({
    name: 'Rejection honored',
    article: 'GDPR Art. 7(3)',
    status: rejectionStatus,
    description: rejectionDesc
  });

  // 4. Purpose specification (Art. 5(1)(b))
  // Heuristik: jika ada banner consent dan tracker yang beragam, sulit verify purpose granularity
  let purposeStatus;
  let purposeDesc;
  if (!meta.consentBannerDetected) {
    purposeStatus = 'non-compliant';
    purposeDesc = 'No consent banner means data purposes are not specified to users.';
  } else {
    const categories = new Set(cookies.map((c) => c.category));
    if (categories.size > 1) {
      purposeStatus = 'partial';
      purposeDesc = `Cookies span ${categories.size} categories (${[...categories].join(', ')}). Verify per-purpose consent granularity is offered.`;
    } else {
      purposeStatus = 'partial';
      purposeDesc = 'Consent banner detected; purpose granularity should be reviewed manually.';
    }
  }
  indicators.push({
    name: 'Purpose specification',
    article: 'GDPR Art. 5(1)(b)',
    status: purposeStatus,
    description: purposeDesc
  });

  const compliant = indicators.filter((i) => i.status === 'compliant').length;
  const partial = indicators.filter((i) => i.status === 'partial').length;
  // Skor: compliant=100%, partial=50%, non=0% — weighted average
  const overallScore = Math.round(((compliant * 100 + partial * 50) / indicators.length));

  return {
    framework: 'GDPR',
    indicators,
    overallScore,
    summary:
      overallScore >= 75 ? 'Mostly compliant' :
      overallScore >= 50 ? 'Partially compliant' :
      'Significant gaps'
  };
}
