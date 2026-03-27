/* global chrome */

import { normalizeZoomFactor } from "../constants/zoom.js";
import { getScreenContextForTab } from "./screen-context-cache.js";
import { getSavedZoomPreference } from "./zoom-store.js";
import { getDomainFromUrl } from "./zoom-utils.js";

async function setTabZoom(tabId, zoomFactor, logMessage) {
  try {
    await chrome.tabs.setZoom(tabId, zoomFactor);
  } catch (error) {
    console.debug(logMessage, { tabId, zoomFactor, error });
  }
}

async function getTabZoomState(tabId) {
  let tab;
  let screenContext;
  let currentZoomFactor;

  try {
    [tab, screenContext, currentZoomFactor] = await Promise.all([
      chrome.tabs.get(tabId),
      getScreenContextForTab(tabId),
      chrome.tabs.getZoom(tabId).then(normalizeZoomFactor)
    ]);
  } catch (error) {
    console.debug("[ScreenSense] failed to get tab state", { tabId, error });
    return undefined;
  }

  const domain = getDomainFromUrl(tab.url);

  if (!domain || !screenContext?.resolutionKey) {
    return undefined;
  }

  const savedPreference = await getSavedZoomPreference({
    domain,
    resolutionKey: screenContext.resolutionKey
  });

  return {
    currentZoomFactor,
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

  await setTabZoom(
    tabId,
    tabZoomState.savedPreference.zoomFactor,
    "[ScreenSense] failed to apply saved zoom"
  );
}

export async function ensureZoomPreferenceForTab(tabId) {
  const tabZoomState = await getTabZoomState(tabId);

  if (!tabZoomState) {
    return;
  }

  if (tabZoomState.savedPreference?.zoomFactor) {
    if (tabZoomState.currentZoomFactor !== tabZoomState.savedPreference.zoomFactor) {
      await setTabZoom(
        tabId,
        tabZoomState.savedPreference.zoomFactor,
        "[ScreenSense] failed to set zoom"
      );
    }

    return;
  }
}
