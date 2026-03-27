/* global chrome */

const ZOOM_RULES_STORAGE_KEY = "zoomRulesByDomainAndResolution";
const PENDING_ZOOM_RULES_STORAGE_KEY = "pendingZoomRulesByDomainAndResolution";

function createPreferenceKey({ domain, resolutionKey }) {
  return `${domain}::${resolutionKey}`;
}

async function readRulesFromStorage(storageKey) {
  try {
    const stored = await chrome.storage.local.get(storageKey);
    return stored[storageKey];
  } catch (error) {
    console.error("[ScreenSense] failed to read zoom rules storage", {
      storageKey,
      error
    });
    throw error;
  }
}

async function readZoomRules() {
  try {
    return (await readRulesFromStorage(ZOOM_RULES_STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

async function writeRulesToStorage(storageKey, rules) {
  try {
    await chrome.storage.local.set({
      [storageKey]: rules
    });
  } catch (error) {
    console.error("[ScreenSense] failed to write zoom rules storage", {
      storageKey,
      error
    });
    throw error;
  }
}

async function writeZoomRules(rules) {
  await writeRulesToStorage(ZOOM_RULES_STORAGE_KEY, rules);
}

async function readPendingZoomRules() {
  try {
    return await readRulesFromStorage(PENDING_ZOOM_RULES_STORAGE_KEY);
  } catch {
    return undefined;
  }
}

async function writePendingZoomRules(rules) {
  await writeRulesToStorage(PENDING_ZOOM_RULES_STORAGE_KEY, rules);
}

async function clearPendingZoomRules() {
  try {
    await chrome.storage.local.remove(PENDING_ZOOM_RULES_STORAGE_KEY);
  } catch (error) {
    console.error("[ScreenSense] failed to clear pending zoom rules", error);
    throw error;
  }
}

async function flushPendingZoomRules() {
  const pendingRules = await readPendingZoomRules();

  if (!pendingRules) {
    return;
  }

  const currentRules = await readZoomRules();

  if (areRulesEqual(currentRules, pendingRules)) {
    await clearPendingZoomRules();
    return;
  }

  await writeZoomRules(pendingRules);
  await clearPendingZoomRules();
}

let zoomRulesWriteQueue = flushPendingZoomRules().catch((error) => {
  console.error("[ScreenSense] failed to flush pending zoom rules", error);
});

function cloneRules(rules) {
  return structuredClone(rules);
}

function areRulesEqual(leftRules, rightRules) {
  return JSON.stringify(leftRules) === JSON.stringify(rightRules);
}

function queueZoomRulesWrite(operation) {
  const queuedOperation = zoomRulesWriteQueue.then(async () => {
    const baseRules = (await readPendingZoomRules()) ?? (await readZoomRules());
    const nextRules = await operation(baseRules);

    if (!nextRules) {
      return;
    }

    await writePendingZoomRules(nextRules);
    await writeZoomRules(nextRules);
    await clearPendingZoomRules();
  });

  zoomRulesWriteQueue = queuedOperation.catch((error) => {
    console.error("[ScreenSense] zoom rules write failed", error);
  });
  return queuedOperation;
}

export async function getSavedZoomPreference({ domain, resolutionKey }) {
  await zoomRulesWriteQueue;
  const rules = (await readPendingZoomRules()) ?? (await readZoomRules());
  return rules[createPreferenceKey({ domain, resolutionKey })];
}

export async function deleteZoomPreference({ domain, resolutionKey }) {
  const preferenceKey = createPreferenceKey({ domain, resolutionKey });
  await queueZoomRulesWrite(async (rules) => {
    if (!(preferenceKey in rules)) {
      return undefined;
    }

    const nextRules = cloneRules(rules);
    delete nextRules[preferenceKey];
    return nextRules;
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
  await queueZoomRulesWrite(async (rules) => {
    const nextRules = cloneRules(rules);

    nextRules[preferenceKey] = {
      domain,
      resolutionKey,
      normalizedScreenWidth,
      normalizedScreenHeight,
      zoomFactor,
      zoomPercent,
      updatedAt: Date.now()
    };

    return nextRules;
  });
}
