/* global chrome */

const screenContextByTabId = new Map();
const SCREEN_CONTEXT_STORAGE_KEY = "screenContextByTabId";

async function readStoredScreenContexts() {
  const stored = await chrome.storage.session.get(SCREEN_CONTEXT_STORAGE_KEY);
  return stored[SCREEN_CONTEXT_STORAGE_KEY] ?? {};
}

async function writeStoredScreenContexts(screenContextsByTabId) {
  await chrome.storage.session.set({
    [SCREEN_CONTEXT_STORAGE_KEY]: screenContextsByTabId
  });
}

export async function getScreenContextForTab(tabId) {
  if (screenContextByTabId.has(tabId)) {
    return screenContextByTabId.get(tabId);
  }

  const storedScreenContexts = await readStoredScreenContexts();
  const screenContext = storedScreenContexts[String(tabId)];

  if (screenContext) {
    screenContextByTabId.set(tabId, screenContext);
  }

  return screenContext;
}

export async function setScreenContextForTab(tabId, screenContext) {
  screenContextByTabId.set(tabId, screenContext);

  const storedScreenContexts = await readStoredScreenContexts();
  storedScreenContexts[String(tabId)] = screenContext;
  await writeStoredScreenContexts(storedScreenContexts);
}

export async function removeScreenContextForTab(tabId) {
  screenContextByTabId.delete(tabId);

  const storedScreenContexts = await readStoredScreenContexts();
  const storageKey = String(tabId);

  if (!(storageKey in storedScreenContexts)) {
    return;
  }

  delete storedScreenContexts[storageKey];
  await writeStoredScreenContexts(storedScreenContexts);
}
