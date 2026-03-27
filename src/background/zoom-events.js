/* global chrome */

import {
  normalizeZoomFactor,
  SUPPORTED_ZOOM_FACTORS
} from "../constants/zoom.js";
import { getScreenContextForTab } from "./screen-context-cache.js";
import { deleteZoomPreference, saveZoomPreference } from "./zoom-store.js";
import { DEFAULT_ZOOM_FACTOR, getDomainFromUrl } from "./zoom-utils.js";

let listenersRegistered = false;
const DEFAULT_ZOOM_PERCENT = Math.round(DEFAULT_ZOOM_FACTOR * 100);
const pendingZoomPayloadByTabId = new Map();

/**
 * Persist or remove a zoom preference for the tab's domain and screen-resolution context.
 *
 * Attempts to look up the tab and its cached screen context; if either is unavailable or the
 * domain or resolutionKey is missing, the function exits without writing. If `payload.zoomPercent`
 * equals the default zoom percent the stored preference for that domain/resolution is deleted;
 * otherwise a zoom preference is saved including normalized screen dimensions and the provided
 * normalized zoom factor and zoom percent. Errors during lookup or persistence are caught and
 * logged; the function does not throw.
 *
 * @param {number} tabId - The id of the tab where the zoom change occurred.
 * @param {{ normalizedZoomFactor: number, zoomPercent: number }} payload - Zoom data to persist.
 */
function createZoomPayload(tabId, newZoomFactor) {
  const normalizedZoomFactor = normalizeZoomFactor(newZoomFactor);

  if (!Number.isFinite(normalizedZoomFactor) || normalizedZoomFactor <= 0) {
    console.debug("[ScreenSense] ignored invalid zoom change", {
      tabId,
      newZoomFactor,
      normalizedZoomFactor
    });
    return undefined;
  }

  return {
    normalizedZoomFactor,
    zoomPercent: Math.round(normalizedZoomFactor * 100),
    isSupportedZoomFactor: SUPPORTED_ZOOM_FACTORS.includes(normalizedZoomFactor)
  };
}

async function persistZoomPreference(tabId, payload, { queueIfContextMissing } = {}) {
  let tab;
  let screenContext;

  try {
    [tab, screenContext] = await Promise.all([
      chrome.tabs.get(tabId),
      getScreenContextForTab(tabId)
    ]);
  } catch (error) {
    console.debug("[ScreenSense] tab unavailable for zoom persistence", {
      tabId,
      error
    });
    return;
  }

  const domain = getDomainFromUrl(tab.url);

  if (!domain) {
    console.debug("[ScreenSense] skipped zoom persistence due to missing context", {
      tabId,
      domain,
      screenContext
    });
    return;
  }

  if (!screenContext?.resolutionKey) {
    if (queueIfContextMissing) {
      pendingZoomPayloadByTabId.set(tabId, payload);
      console.debug("[ScreenSense] queued zoom persistence until screen context is available", {
        tabId,
        domain
      });
    } else {
      console.debug("[ScreenSense] skipped queued zoom persistence due to missing context", {
        tabId,
        domain
      });
    }

    return;
  }

  try {
    if (payload.zoomPercent === DEFAULT_ZOOM_PERCENT) {
      await deleteZoomPreference({
        domain,
        resolutionKey: screenContext.resolutionKey
      });
      return;
    }

    pendingZoomPayloadByTabId.delete(tabId);
    await saveZoomPreference({
      domain,
      resolutionKey: screenContext.resolutionKey,
      normalizedScreenWidth: screenContext.normalizedScreenWidth,
      normalizedScreenHeight: screenContext.normalizedScreenHeight,
      zoomFactor: payload.normalizedZoomFactor,
      zoomPercent: payload.zoomPercent
    });
  } catch (error) {
    console.debug("[ScreenSense] failed to persist zoom preference", {
      tabId,
      domain,
      error
    });
  }
}

/**
 * Register a single chrome.tabs.onZoomChange listener that persists user zoom changes for tabs.
 *
 * Subsequent calls are a no-op. For each zoom change the listener normalizes the new zoom factor,
 * computes a rounded zoom percent, determines whether the factor is supported, and initiates a
 * best-effort persistence of the preference (persistence is started without awaiting and may not
 * complete before the worker is terminated).
 */
export async function flushPendingZoomPreferenceForTab(tabId) {
  const pendingPayload = pendingZoomPayloadByTabId.get(tabId);

  if (!pendingPayload) {
    return;
  }

  await persistZoomPreference(tabId, pendingPayload, {
    queueIfContextMissing: false
  });
}
export function registerZoomChangeListener() {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    try {
      const { newZoomFactor, oldZoomFactor, tabId, zoomSettings } =
        zoomChangeInfo;
      const payload = createZoomPayload(tabId, newZoomFactor);

      if (!payload) {
        return;
      }

      console.debug("[ScreenSense] tab zoom changed", {
        tabId,
        oldZoomFactor,
        newZoomFactor,
        normalizedZoomFactor: payload.normalizedZoomFactor,
        isSupportedZoomFactor: payload.isSupportedZoomFactor,
        mode: zoomSettings?.mode,
        scope: zoomSettings?.scope,
        defaultZoomFactor: zoomSettings?.defaultZoomFactor
      });

      // MV3 may terminate the worker before this best-effort write finishes.
      // That trade-off is acceptable here because the event is user initiated.
      void persistZoomPreference(tabId, payload, {
        queueIfContextMissing: true
      });
    } catch (error) {
      console.debug("[ScreenSense] failed to process zoom change", {
        error,
        tabId: zoomChangeInfo?.tabId,
        newZoomFactor: zoomChangeInfo?.newZoomFactor
      });
    }
  });
}
