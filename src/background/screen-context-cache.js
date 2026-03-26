/* global chrome */

const screenContextByTabId = new Map();

function createScreenContextStorageKey(tabId) {
  return `screenContext_${tabId}`;
}

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

export async function getScreenContextForTab(tabId) {
  if (screenContextByTabId.has(tabId)) {
    return screenContextByTabId.get(tabId);
  }

  const screenContext = await readStoredScreenContextForTab(tabId);

  if (screenContext) {
    screenContextByTabId.set(tabId, screenContext);
  }

  return screenContext;
}

export async function setScreenContextForTab(tabId, screenContext) {
  screenContextByTabId.set(tabId, screenContext);
  await writeStoredScreenContextForTab(tabId, screenContext);
}

export async function removeScreenContextForTab(tabId) {
  screenContextByTabId.delete(tabId);
  await chrome.storage.session.remove(createScreenContextStorageKey(tabId));
}
