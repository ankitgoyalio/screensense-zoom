const screenContextByTabId = new Map();

export function getScreenContextForTab(tabId) {
  return screenContextByTabId.get(tabId);
}

export function setScreenContextForTab(tabId, screenContext) {
  screenContextByTabId.set(tabId, screenContext);
}

export function removeScreenContextForTab(tabId) {
  screenContextByTabId.delete(tabId);
}
