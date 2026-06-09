import { scoreLikelihood } from './likelihoodScoring.js';
import { scoreImpact } from './impactScoring.js';

function classifyRiskLevel(score) {
  if (score >= 8.0) return { level: 'Critical', color: 'red' };
  if (score >= 6.0) return { level: 'High', color: 'orange' };
  if (score >= 3.0) return { level: 'Medium', color: 'yellow' };
  return { level: 'Low', color: 'green' };
}

function buildRecommendations({ likelihood, impact, cookies, scanData }) {
  const recs = [];

  if (likelihood.subFactors.domainCount.score === 3) {
    recs.push({
      priority: 'High',
      title: 'Reduce third-party domain footprint',
      description: `Your site loads cookies from ${likelihood.subFactors.domainCount.value} unique third-party domains. Audit and remove unused trackers and SDKs.`
    });
  }

  if (likelihood.subFactors.knownTrackers.score === 3) {
    recs.push({
      priority: 'High',
      title: 'Limit major advertising/analytics networks',
      description: 'Multiple high-prevalence tracker networks were found. Consider privacy-friendly alternatives (e.g. Plausible, Fathom) or first-party analytics.'
    });
  }

  if (likelihood.subFactors.persistence.score === 3) {
    recs.push({
      priority: 'Medium',
      title: 'Shorten cookie lifetimes',
      description: `Longest cookie lives for ${likelihood.subFactors.persistence.value} days. Set Max-Age <30 days where possible to reduce tracking persistence.`
    });
  }

  const persistAfter = likelihood.subFactors.crossDomain.value.persistAfterReject;
  if (persistAfter > 0) {
    recs.push({
      priority: 'High',
      title: 'Honor cookie rejection',
      description: `${persistAfter} cookie(s) persisted after the user rejected consent. This is a direct GDPR Art. 7(3) violation and likely contradicts UU PDP Pasal 22.`
    });
  }

  if (!scanData.metadata.consentBannerDetected) {
    recs.push({
      priority: 'High',
      title: 'Implement a consent management platform',
      description: 'No cookie consent banner was detected. GDPR and UU PDP both require explicit opt-in consent before non-essential tracking.'
    });
  }

  if (!scanData.metadata.privacyPolicyFound) {
    recs.push({
      priority: 'Medium',
      title: 'Publish an accessible privacy policy',
      description: 'No privacy policy link was found on the landing page. Place a visible link in the footer and disclose data controller, purposes, and DPO contact.'
    });
  }

  const insecure = cookies.filter((c) => !c.secure);
  if (insecure.length > 0) {
    recs.push({
      priority: 'Medium',
      title: 'Set the Secure flag on cookies',
      description: `${insecure.length} cookie(s) lack the Secure flag. Mark cookies Secure to prevent transmission over plain HTTP.`
    });
  }

  const looseSameSite = cookies.filter((c) => !c.sameSite || c.sameSite === 'None');
  if (looseSameSite.length > 0) {
    recs.push({
      priority: 'Low',
      title: 'Tighten SameSite attribute',
      description: `${looseSameSite.length} cookie(s) have SameSite=None or missing. Prefer Lax or Strict to mitigate CSRF and cross-site tracking.`
    });
  }

  if (impact.subFactors.dataType.score === 3) {
    recs.push({
      priority: 'Medium',
      title: 'Minimize behavioral profiling',
      description: 'Detected combination of advertising + analytics/social trackers suggests demographic and location profiling. Apply data minimization.'
    });
  }

  // Sort: High → Medium → Low
  const order = { High: 0, Medium: 1, Low: 2 };
  recs.sort((a, b) => order[a.priority] - order[b.priority]);

  return recs;
}

export function calculateRisk({ cookies, category, scanData }) {
  const likelihood = scoreLikelihood(cookies);
  const impact = scoreImpact(cookies, category, scanData);

  // Formula OWASP: Risk = Likelihood × Impact (rentang 1-9)
  const riskScore = parseFloat((likelihood.score * impact.score).toFixed(2));
  const classification = classifyRiskLevel(riskScore);

  const recommendations = buildRecommendations({
    likelihood,
    impact,
    cookies,
    scanData
  });

  return {
    riskScore,
    riskLevel: classification.level,
    riskColor: classification.color,
    likelihoodScore: likelihood.score,
    impactScore: impact.score,
    likelihoodFactors: likelihood.subFactors,
    impactFactors: impact.subFactors,
    recommendations
  };
}
