// Indikator kepatuhan UU No. 27/2022 tentang Perlindungan Data Pribadi (UU PDP)
// Pasal acuan: Pasal 20 (dasar hukum), Pasal 22 (consent), Pasal 5-15 (hak subjek), Pasal 53 (DPO)
export function checkUUPDP(scanData, cookies) {
  const meta = scanData.metadata;
  const indicators = [];

  // 1. Dasar hukum yang valid (Pasal 20)
  indicators.push({
    name: 'Dasar hukum pemrosesan data',
    article: 'UU PDP Pasal 20',
    status: meta.consentBannerDetected ? 'partial' : 'non-compliant',
    description: meta.consentBannerDetected
      ? 'Mekanisme consent terdeteksi - dasar hukum eksis tetapi perlu verifikasi manual jenis legal basis-nya.'
      : 'Tidak ada mekanisme consent. UU PDP Pasal 20 mensyaratkan dasar hukum yang sah untuk pemrosesan data pribadi.'
  });

  // 2. Consent diperoleh sebelum pengumpulan data (Pasal 22)
  const preConsentTrackers = cookies.filter(
    (c) => c.category === 'advertising' || c.category === 'analytics' || c.category === 'social media'
  ).length;

  let preConsentStatus;
  let preConsentDesc;
  if (preConsentTrackers === 0) {
    preConsentStatus = 'compliant';
    preConsentDesc = 'Tidak ada tracking cookie yang dipasang sebelum interaksi pengguna.';
  } else if (preConsentTrackers <= 5) {
    preConsentStatus = 'partial';
    preConsentDesc = `${preConsentTrackers} cookie tracking terpasang sebelum tindakan consent pengguna.`;
  } else {
    preConsentStatus = 'non-compliant';
    preConsentDesc = `${preConsentTrackers} cookie tracking terpasang sebelum consent. Melanggar UU PDP Pasal 22 yang mensyaratkan persetujuan eksplisit sebelum pengumpulan.`;
  }

  indicators.push({
    name: 'Consent sebelum pengumpulan data',
    article: 'UU PDP Pasal 22',
    status: preConsentStatus,
    description: preConsentDesc
  });

  // 3. Notifikasi hak subjek data (Pasal 5-15)
  indicators.push({
    name: 'Notifikasi hak subjek data',
    article: 'UU PDP Pasal 5-15',
    status: meta.privacyPolicyFound ? 'partial' : 'non-compliant',
    description: meta.privacyPolicyFound
      ? 'Privacy policy ditemukan - kandungan hak subjek (akses, koreksi, penghapusan) perlu diverifikasi manual di dokumen.'
      : 'Tidak ditemukan privacy policy. UU PDP Pasal 5-15 mewajibkan pemberitahuan hak subjek data.'
  });

  // 4. Kontak DPO/Data Protection Officer (Pasal 53)
  // Tidak bisa diverifikasi otomatis tanpa parsing dalam privacy policy
  indicators.push({
    name: 'Kontak DPO yang dapat dihubungi',
    article: 'UU PDP Pasal 53',
    status: meta.privacyPolicyFound ? 'partial' : 'non-compliant',
    description: meta.privacyPolicyFound
      ? 'Privacy policy ditemukan - keberadaan kontak DPO perlu diverifikasi langsung pada dokumen kebijakan.'
      : 'Tidak ada privacy policy. UU PDP Pasal 53 mewajibkan kontak DPO yang dapat dihubungi subjek data.'
  });

  const compliant = indicators.filter((i) => i.status === 'compliant').length;
  const partial = indicators.filter((i) => i.status === 'partial').length;
  const overallScore = Math.round(((compliant * 100 + partial * 50) / indicators.length));

  return {
    framework: 'UU PDP No. 27/2022',
    indicators,
    overallScore,
    summary:
      overallScore >= 75 ? 'Mostly compliant' :
      overallScore >= 50 ? 'Partially compliant' :
      'Significant gaps'
  };
}
