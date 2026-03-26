/* global chrome */

import {
  normalizeZoomFactor,
  SUPPORTED_ZOOM_FACTORS
} from "../constants/zoom.js";
import { getScreenContextForTab } from "./screen-context-cache.js";
import { deleteZoomPreference, saveZoomPreference } from "./zoom-store.js";
import { DEFAULT_ZOOM_FACTOR, getDomainFromUrl } from "./zoom-utils.js";

let listenersRegistered = false;

async function persistZoomPreference(tabId, payload) {
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

  if (!domain || !screenContext?.resolutionKey) {
    console.debug("[ScreenSense] skipped zoom persistence due to missing context", {
      tabId,
      domain,
      screenContext
    });
    return;
  }

  try {
    if (payload.normalizedZoomFactor === DEFAULT_ZOOM_FACTOR) {
      await deleteZoomPreference({
        domain,
        resolutionKey: screenContext.resolutionKey
      });
      return;
    }

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

export function registerZoomChangeListener() {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    const { newZoomFactor, oldZoomFactor, tabId, zoomSettings } =
      zoomChangeInfo;
    const normalizedZoomFactor = normalizeZoomFactor(newZoomFactor);
    const zoomPercent = Math.round(normalizedZoomFactor * 100);
    const isSupportedZoomFactor = SUPPORTED_ZOOM_FACTORS.includes(
      normalizedZoomFactor
    );

    console.debug("[ScreenSense] tab zoom changed", {
      tabId,
      oldZoomFactor,
      newZoomFactor,
      normalizedZoomFactor,
      isSupportedZoomFactor,
      mode: zoomSettings.mode,
      scope: zoomSettings.scope,
      defaultZoomFactor: zoomSettings.defaultZoomFactor
    });

    const payload = {
      normalizedZoomFactor,
      zoomPercent,
      isSupportedZoomFactor
    };

    // MV3 may terminate the worker before this best-effort write finishes.
    // That trade-off is acceptable here because the event is user initiated.
    void persistZoomPreference(tabId, payload);
  });
}
