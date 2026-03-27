/* global chrome */

const screenContextByTabId = new Map();
const pendingMutationsByTabId = new Map();

/**
 * Builds the session-storage key for a tab's screen context.
 * @param {number|string} tabId - The browser tab identifier.
 * @returns {string} The session-storage key for the tab's screen context.
 */
function createScreenContextStorageKey(tabId) {
  return `screenContext_${tabId}`;
}

/**
 * Check whether a Chrome tab with the given id currently exists.
 * @param {number} tabId - The id of the Chrome tab to verify.
 * @returns {boolean} `true` if the tab exists, `false` otherwise.
 */
async function doesTabExist(tabId) {
  try {
    await chrome.tabs.get(tabId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the stored screen context for a given tab from session storage.
 * @param {number} tabId - Chrome tab id whose screen context to read.
 * @returns {any} The stored screen context for the tab, or `undefined` if none is stored or a read error occurred.
 */
async function readStoredScreenContextForTab(tabId) {
  const storageKey = createScreenContextStorageKey(tabId);

  try {
    const stored = await chrome.storage.session.get(storageKey);
    return stored[storageKey];
  } catch (error) {
    console.error("[ScreenSense] failed to read screen context", {
      storageKey,
      error
    });
    return undefined;
  }
}

/**
 * Persist the given screen context for a tab into Chrome session storage.
 * @param {number} tabId - The tab identifier used to build the storage key.
 * @param {*} screenContext - The screen context value to persist.
 * @throws Will rethrow the underlying error if writing to chrome.storage.session fails.
 */
async function writeStoredScreenContextForTab(tabId, screenContext) {
  const storageKey = createScreenContextStorageKey(tabId);

  try {
    await chrome.storage.session.set({
      [storageKey]: screenContext
    });
  } catch (error) {
    console.error("[ScreenSense] failed to write screen context", {
      storageKey,
      error
    });
    throw error;
  }
}

/**
 * Retrieve the screen context for a tab, resolving to the cached or persisted context when present; if a stored context exists but the tab no longer exists it is removed and `undefined` is returned.
 * @param {number} tabId - Chrome tab identifier.
 * @returns {object|undefined} The screen context for the tab, or `undefined` if no context exists or the tab is not present.
 */
function enqueueTabMutation(tabId, mutation) {
  const previousMutation = pendingMutationsByTabId.get(tabId) ?? Promise.resolve();
  const nextMutation = previousMutation
    .catch(() => {})
    .then(mutation)
    .finally(() => {
      if (pendingMutationsByTabId.get(tabId) === nextMutation) {
        pendingMutationsByTabId.delete(tabId);
      }
    });

  pendingMutationsByTabId.set(tabId, nextMutation);
  return nextMutation;
}
export async function getScreenContextForTab(tabId) {
  if (screenContextByTabId.has(tabId)) {
    return screenContextByTabId.get(tabId);
  }

  const screenContext = await readStoredScreenContextForTab(tabId);

  if (!screenContext) {
    return undefined;
  }

  if (!(await doesTabExist(tabId))) {
    void removeScreenContextForTab(tabId).catch((error) => {
      console.debug("[ScreenSense] cleanup failed for stale tab context", {
        tabId,
        error
      });
    });
    return undefined;
  }

  screenContextByTabId.set(tabId, screenContext);
  return screenContext;
}

/**
 * Set the screen context for a tab and persist it to session storage.
 *
 * @param {number} tabId - Chrome tab identifier.
 * @param {*} screenContext - Screen context value to cache and store.
 * @throws {Error} If writing to session storage fails; the in-memory cache is restored to its previous state before the error is rethrown.
 */
export function setScreenContextForTab(tabId, screenContext) {
  return enqueueTabMutation(tabId, async () => {
    const previousScreenContext = screenContextByTabId.get(tabId);
    screenContextByTabId.set(tabId, screenContext);

    try {
      await writeStoredScreenContextForTab(tabId, screenContext);
    } catch (error) {
      if (previousScreenContext !== undefined) {
        screenContextByTabId.set(tabId, previousScreenContext);
      } else {
        screenContextByTabId.delete(tabId);
      }

      throw error;
    }
  });
}

/**
 * Remove stored screen context for a tab and clear its in-memory cache.
 * @param {number} tabId - Chrome tab id whose screen context should be removed.
 * @throws {Error} If removing the session storage entry fails; the previous cache is restored before the error is rethrown.
 */
export function removeScreenContextForTab(tabId) {
  return enqueueTabMutation(tabId, async () => {
    const cachedScreenContext = screenContextByTabId.get(tabId);
    screenContextByTabId.delete(tabId);

    try {
      await chrome.storage.session.remove(createScreenContextStorageKey(tabId));
    } catch (error) {
      if (cachedScreenContext) {
        screenContextByTabId.set(tabId, cachedScreenContext);
      }

      console.error("[ScreenSense] failed to remove screen context", {
        tabId,
        error
      });
      throw error;
    }
  });
}
