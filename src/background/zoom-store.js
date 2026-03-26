/* global chrome */

const ZOOM_RULES_STORAGE_KEY = "zoomRulesByDomainAndResolution";
let zoomRulesWriteQueue = Promise.resolve();

function createPreferenceKey({ domain, resolutionKey }) {
  return `${domain}::${resolutionKey}`;
}

async function readZoomRules() {
  try {
    const stored = await chrome.storage.local.get(ZOOM_RULES_STORAGE_KEY);
    return stored[ZOOM_RULES_STORAGE_KEY] ?? {};
  } catch (error) {
    console.error("[ScreenSense] failed to read zoom rules", error);
    return {};
  }
}

function queueZoomRulesWrite(operation) {
  const queuedOperation = zoomRulesWriteQueue.then(operation);
  zoomRulesWriteQueue = queuedOperation.catch(() => undefined);
  return queuedOperation;
}

async function writeZoomRules(rules) {
  await chrome.storage.local.set({
    [ZOOM_RULES_STORAGE_KEY]: rules
  });
}

export async function getSavedZoomPreference({ domain, resolutionKey }) {
  await zoomRulesWriteQueue;
  const rules = await readZoomRules();
  return rules[createPreferenceKey({ domain, resolutionKey })];
}

export async function deleteZoomPreference({ domain, resolutionKey }) {
  const preferenceKey = createPreferenceKey({ domain, resolutionKey });
  await queueZoomRulesWrite(async () => {
    const rules = await readZoomRules();

    if (!(preferenceKey in rules)) {
      return;
    }

    delete rules[preferenceKey];
    await writeZoomRules(rules);
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
  const preferenceKey = createPreferenceKey({ domain, resolutionKey });
  await queueZoomRulesWrite(async () => {
    const rules = await readZoomRules();

    rules[preferenceKey] = {
      domain,
      resolutionKey,
      normalizedScreenWidth,
      normalizedScreenHeight,
      zoomFactor,
      zoomPercent,
      updatedAt: Date.now()
    };

    await writeZoomRules(rules);
  });
}
