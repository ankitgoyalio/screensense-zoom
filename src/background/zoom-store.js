/* global chrome */

const ZOOM_RULES_STORAGE_KEY = "zoomRulesByDomainAndResolution";

function createPreferenceKey({ domain, resolutionKey }) {
  return `${domain}::${resolutionKey}`;
}

async function readZoomRules() {
  const stored = await chrome.storage.local.get(ZOOM_RULES_STORAGE_KEY);
  return stored[ZOOM_RULES_STORAGE_KEY] ?? {};
}

export async function getSavedZoomPreference({ domain, resolutionKey }) {
  const rules = await readZoomRules();
  return rules[createPreferenceKey({ domain, resolutionKey })];
}

export async function deleteZoomPreference({ domain, resolutionKey }) {
  const rules = await readZoomRules();
  const preferenceKey = createPreferenceKey({ domain, resolutionKey });

  if (!(preferenceKey in rules)) {
    return;
  }

  delete rules[preferenceKey];

  await chrome.storage.local.set({
    [ZOOM_RULES_STORAGE_KEY]: rules
  });
}

export async function saveZoomPreference({
  domain,
  resolutionKey,
  normalizedScreenWidth,
  normalizedScreenHeight,
  zoomFactor,
  zoomPercent
}) {
  const rules = await readZoomRules();
  const preferenceKey = createPreferenceKey({ domain, resolutionKey });

  rules[preferenceKey] = {
    domain,
    resolutionKey,
    normalizedScreenWidth,
    normalizedScreenHeight,
    zoomFactor,
    zoomPercent,
    updatedAt: Date.now()
  };

  await chrome.storage.local.set({
    [ZOOM_RULES_STORAGE_KEY]: rules
  });
}
