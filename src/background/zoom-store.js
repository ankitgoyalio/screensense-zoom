/* global chrome */

const ZOOM_RULES_STORAGE_KEY = "zoomRulesByDomainAndResolution";
const PENDING_ZOOM_RULES_STORAGE_KEY = "pendingZoomRulesByDomainAndResolution";

/**
 * Create a composite preference key combining a domain and a resolution identifier.
 * @param {Object} params
 * @param {string} params.domain - The domain associated with the preference.
 * @param {string} params.resolutionKey - The resolution-specific identifier.
 * @returns {string} The composite key in the form `domain::resolutionKey`.
 */
function createPreferenceKey({ domain, resolutionKey }) {
  return `${domain}::${resolutionKey}`;
}

/**
 * Read and return the value stored under the given chrome.storage.local key.
 * @param {string} storageKey - The storage key to read.
 * @returns {*} The stored value for the key, or `undefined` if not present.
 * @throws {Error} If reading from chrome.storage.local fails.
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
async function readRulesFromStorage(storageKey) {
  try {
    const stored = await chrome.storage.local.get(storageKey);
    const rules = stored[storageKey];

    if (rules === undefined) {
      return storageKey === ZOOM_RULES_STORAGE_KEY ? {} : undefined;
    }

    if (isPlainObject(rules)) {
      return rules;
    }

    console.warn("[ScreenSense] ignored invalid zoom rules storage payload", {
      storageKey,
      valueType: Array.isArray(rules) ? "array" : typeof rules
    });
    return storageKey === ZOOM_RULES_STORAGE_KEY ? {} : undefined;
  } catch (error) {
    console.error("[ScreenSense] failed to read zoom rules storage", {
      storageKey,
      error
    });
    throw error;
  }
}

/**
 * Load committed zoom rules from persistent storage.
 * @returns {Object} The committed zoom rules object, or `{}` if no rules are stored or a storage read fails.
 */
async function readZoomRules() {
  return await readRulesFromStorage(ZOOM_RULES_STORAGE_KEY);
}

/**
 * Persist a rules object under the specified storage key in chrome.storage.local.
 *
 * @param {string} storageKey - The storage key to write to (e.g. committed or pending rules key).
 * @param {Object} rules - The rules object to persist (mapping of preference keys to rule entries).
 * @throws {Error} If the storage write fails; the original error is rethrown.
 */
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

/**
 * Persist committed zoom rules to the extension's committed storage key.
 * @param {Object} rules - Mapping of preference keys to zoom preference objects to save.
 */
async function writeZoomRules(rules) {
  await writeRulesToStorage(ZOOM_RULES_STORAGE_KEY, rules);
}

/**
 * Retrieve pending zoom rules from local storage.
 * @returns {Object|undefined} The pending zoom rules object stored under the pending key, or `undefined` if no pending rules exist or a storage read error occurred.
 */
async function readPendingZoomRules() {
  return await readRulesFromStorage(PENDING_ZOOM_RULES_STORAGE_KEY);
}

async function readZoomRulesSilent() {
  try {
    return await readZoomRules();
  } catch {
    return {};
  }
}

async function readPendingZoomRulesSilent() {
  try {
    return await readPendingZoomRules();
  } catch {
    return undefined;
  }
}

/**
 * Persist the given pending zoom rules under the pending storage key.
 * @param {Object<string, Object>|undefined} rules - Mapping of preference keys to zoom rule objects to store; may be `undefined` to clear the pending entry.
 */
async function writePendingZoomRules(rules) {
  await writeRulesToStorage(PENDING_ZOOM_RULES_STORAGE_KEY, rules);
}

/**
 * Remove any staged pending zoom rules from chrome.storage.local.
 *
 * @throws {Error} If removing the pending rules from storage fails.
 */
async function clearPendingZoomRules() {
  try {
    await chrome.storage.local.remove(PENDING_ZOOM_RULES_STORAGE_KEY);
  } catch (error) {
    console.error("[ScreenSense] failed to clear pending zoom rules", error);
    throw error;
  }
}

/**
 * Apply any pending zoom rules to the committed storage state when needed.
 *
 * If no pending rules exist, this function exits. If pending rules are
 * identical to the committed rules it clears the pending buffer. If they
 * differ it writes the pending rules to committed storage and then clears
 * the pending buffer.
 */
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

/**
 * Create a deep clone of the zoom rules object.
 * @param {Object} rules - Mapping of preference keys to zoom preference entries.
 * @returns {Object} A deep copy of `rules`.
 */
function cloneRules(rules) {
  return structuredClone(rules);
}

/**
 * Determines whether two rule objects represent the same data.
 * @param {Object} leftRules - The first rules object to compare.
 * @param {Object} rightRules - The second rules object to compare.
 * @returns {boolean} `true` if both objects have the same structure and values, `false` otherwise.
 */
function areRulesEqual(leftRules, rightRules) {
  return JSON.stringify(leftRules) === JSON.stringify(rightRules);
}

/**
 * Enqueue an operation that reads current rules, applies an update, and persists the result sequentially.
 *
 * @param {(baseRules: Object|undefined) => (Object|undefined|Promise<Object|undefined>)} operation - Function that receives the current rules (pending if present, otherwise committed) and returns the next rules object to persist, or a falsy value to skip writes.
 * @returns {Promise<void>} A promise that resolves when the queued operation (and any resulting storage writes or pending-clear) complete.
 */
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

/**
 * Retrieve the stored zoom preference for the given domain and resolution key.
 * @param {string} domain - The domain (host) the preference applies to.
 * @param {string} resolutionKey - The resolution identifier used in the preference key.
 * @returns {Object|undefined} The saved preference object for that key, or `undefined` if none exists.
 */
export async function getSavedZoomPreference({ domain, resolutionKey }) {
  await zoomRulesWriteQueue;
  const rules =
    (await readPendingZoomRulesSilent()) ?? (await readZoomRulesSilent());
  return rules[createPreferenceKey({ domain, resolutionKey })];
}

/**
 * Remove the stored zoom preference for the specified domain and resolution key.
 *
 * If no preference exists for the computed key, the function performs no storage writes.
 * @param {{domain: string, resolutionKey: string}} params - Parameters object.
 * @param {string} params.domain - The domain (host) the preference is associated with.
 * @param {string} params.resolutionKey - The resolution identifier used in the preference key.
 */
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

/**
 * Persist a zoom preference for the given domain and resolution.
 *
 * Stores the provided normalized dimensions and zoom values under a composite preference key
 * and records the time of the update.
 *
 * @param {Object} params - Parameters for the preference to save.
 * @param {string} params.domain - The domain the preference applies to.
 * @param {string} params.resolutionKey - A key identifying the resolution bucket.
 * @param {number} params.normalizedScreenWidth - The normalized screen width for which this preference applies.
 * @param {number} params.normalizedScreenHeight - The normalized screen height for which this preference applies.
 * @param {number} params.zoomFactor - The zoom factor (e.g., 1.25).
 * @param {number} params.zoomPercent - The zoom expressed as a percent (e.g., 125).
 */
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
