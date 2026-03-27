/* global chrome */

import { normalizeZoomFactor } from "../constants/zoom.js";
import { getScreenContextForTab } from "./screen-context-cache.js";
import { getSavedZoomPreference } from "./zoom-store.js";
import { getDomainFromUrl } from "./zoom-utils.js";

/**
 * Set the zoom factor for a browser tab and suppress errors by logging them.
 *
 * On failure, logs `logMessage` and an object containing `tabId`, `zoomFactor`, and the caught `error` via console.debug.
 * @param {number} tabId - ID of the tab whose zoom should be set.
 * @param {number} zoomFactor - Target zoom factor (for example, 1 for 100%).
 * @param {string} logMessage - Message prefix used when logging failures.
 */
async function setTabZoom(tabId, zoomFactor, logMessage) {
  try {
    await chrome.tabs.setZoom(tabId, zoomFactor);
  } catch (error) {
    console.debug(logMessage, { tabId, zoomFactor, error });
  }
}

/**
 * Collects the zoom and screen-context state for a tab.
 *
 * Attempts to load the tab record, its cached screen context, and the tab's current
 * normalized zoom factor; resolves any saved zoom preference for the tab's domain
 * and screen resolution key. Returns undefined if any required information cannot
 * be determined.
 *
 * @param {number} tabId - The ID of the tab to inspect.
 * @returns {{ currentZoomFactor: number, domain: string, savedPreference: Object|null, screenContext: Object }|undefined}
 *          An object containing:
 *          - `currentZoomFactor`: the normalized current zoom factor for the tab.
 *          - `domain`: the tab's domain extracted from its URL.
 *          - `savedPreference`: the saved zoom preference for `{ domain, resolutionKey }`, or `null` if none.
 *          - `screenContext`: the screen context associated with the tab.
 *          Returns `undefined` when the tab, domain, screen context, or zoom information cannot be obtained.
 */
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

/**
 * Apply the saved (or default) zoom factor to the specified tab when it differs from the tab's current zoom.
 * @param {number} tabId - The browser tab ID whose zoom should be updated.
 */
export async function applySavedZoomForTab(tabId) {
  const tabZoomState = await getTabZoomState(tabId);

  if (!tabZoomState) {
    return;
  }

  const targetZoomFactor =
    tabZoomState.savedPreference?.zoomFactor ?? normalizeZoomFactor(1);

  if (tabZoomState.currentZoomFactor === targetZoomFactor) {
    return;
  }

  await setTabZoom(
    tabId,
    targetZoomFactor,
    "[ScreenSense] failed to apply saved zoom"
  );
}

/**
 * Ensure a tab's zoom matches its saved preference, applying a fallback zoom when no preference exists.
 *
 * If the tab's state cannot be determined, the function does nothing. When a saved zoom exists it
 * sets the tab's zoom to that value; otherwise it sets the tab's zoom to a normalized 1.0 only if
 * the current zoom differs.
 *
 * @param {number} tabId - The id of the tab to enforce the zoom preference for.
 */
export async function ensureZoomPreferenceForTab(tabId) {
  const tabZoomState = await getTabZoomState(tabId);

  if (!tabZoomState) {
    return;
  }

  const targetZoomFactor =
    tabZoomState.savedPreference?.zoomFactor ?? normalizeZoomFactor(1);

  if (tabZoomState.currentZoomFactor !== targetZoomFactor) {
    await setTabZoom(
      tabId,
      targetZoomFactor,
      "[ScreenSense] failed to set zoom"
    );
  }

  if (tabZoomState.savedPreference?.zoomFactor) {
    return;
  }
}
