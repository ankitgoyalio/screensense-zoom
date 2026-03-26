/* global chrome */

import { normalizeZoomFactor } from "../constants/zoom.js";
import { getScreenContextForTab } from "./screen-context-cache.js";
import { getSavedZoomPreference } from "./zoom-store.js";

const DEFAULT_ZOOM_FACTOR = 1;
function getDomainFromUrl(url) {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

async function getTabZoomState(tabId) {
  const [tab, screenContext] = await Promise.all([
    chrome.tabs.get(tabId),
    getScreenContextForTab(tabId)
  ]);
  const domain = getDomainFromUrl(tab.url);

  if (!domain || !screenContext?.resolutionKey) {
    return undefined;
  }

  const currentZoomFactor = normalizeZoomFactor(await chrome.tabs.getZoom(tabId));
  const currentZoomPercent = Math.round(currentZoomFactor * 100);
  const savedPreference = await getSavedZoomPreference({
    domain,
    resolutionKey: screenContext.resolutionKey
  });

  return {
    currentZoomFactor,
    currentZoomPercent,
    domain,
    savedPreference,
    screenContext
  };
}

export async function applySavedZoomForTab(tabId) {
  const tabZoomState = await getTabZoomState(tabId);

  if (!tabZoomState?.savedPreference?.zoomFactor) {
    return;
  }

  if (tabZoomState.currentZoomFactor === tabZoomState.savedPreference.zoomFactor) {
    return;
  }

  await chrome.tabs.setZoom(tabId, tabZoomState.savedPreference.zoomFactor);
}

export async function ensureZoomPreferenceForTab(tabId) {
  const tabZoomState = await getTabZoomState(tabId);

  if (!tabZoomState) {
    return;
  }

  if (tabZoomState.savedPreference?.zoomFactor) {
    if (tabZoomState.currentZoomFactor !== tabZoomState.savedPreference.zoomFactor) {
      await chrome.tabs.setZoom(tabId, tabZoomState.savedPreference.zoomFactor);
    }

    return;
  }

  if (tabZoomState.currentZoomFactor !== DEFAULT_ZOOM_FACTOR) {
    await chrome.tabs.setZoom(tabId, DEFAULT_ZOOM_FACTOR);
  }
}
