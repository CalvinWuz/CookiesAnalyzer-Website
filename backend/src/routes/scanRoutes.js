import express from 'express';
import { scanWebsite } from '../scanner/cookieScanner.js';
import { classifyCookies } from '../scanner/trackerClassifier.js';
import { calculateRisk } from '../risk/riskCalculator.js';
import { checkGDPR } from '../compliance/gdprChecker.js';
import { checkUUPDP } from '../compliance/uupdpChecker.js';

const router = express.Router();

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

router.post('/scan', async (req, res) => {
  const { url, category } = req.body || {};

  if (!url || typeof url !== 'string' || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL. Must be a valid http(s) URL.' });
  }

  const normalizedCategory = typeof category === 'string' ? category.toLowerCase() : 'other';

  try {
    // Jalankan scanning (3 iterasi baseline + 1 iterasi rejection)
    const scanData = await scanWebsite(url);

    // Klasifikasi cookies via tracker database
    const classified = await classifyCookies(scanData.cookies);

    // Hitung risk score berdasarkan OWASP methodology
    const riskAssessment = calculateRisk({
      cookies: classified,
      category: normalizedCategory,
      scanData
    });

    // Cek kepatuhan regulasi
    const gdpr = checkGDPR(scanData, classified);
    const uupdp = checkUUPDP(scanData, classified);

    res.json({
      url,
      category: normalizedCategory,
      timestamp: new Date().toISOString(),
      cookies: classified,
      ...riskAssessment,
      compliance: { gdpr, uupdp },
      scanMetadata: scanData.metadata
    });
  } catch (err) {
    console.error('Scan failed:', err);
    const message = err?.message || 'Scan failed';
    if (/timeout/i.test(message)) {
      return res.status(504).json({ error: 'Scan timed out. The target website took too long to load.' });
    }
    if (/ERR_NAME_NOT_RESOLVED|ENOTFOUND/i.test(message)) {
      return res.status(400).json({ error: 'Could not resolve target domain. Check the URL.' });
    }
    res.status(500).json({ error: message });
  }
});

export default router;
