/* global chrome */

import {
  normalizeZoomFactor,
  SUPPORTED_ZOOM_FACTORS
} from "../constants/zoom.js";
import { getScreenContextForTab } from "./screen-context-cache.js";
import { deleteZoomPreference, saveZoomPreference } from "./zoom-store.js";

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

async function persistZoomPreference(tabId, payload) {
  const [tab, screenContext] = await Promise.all([
    chrome.tabs.get(tabId),
    Promise.resolve(getScreenContextForTab(tabId))
  ]);
  const domain = getDomainFromUrl(tab.url);

  if (!domain || !screenContext?.resolutionKey) {
    console.debug("[ScreenSense] skipped zoom persistence due to missing context", {
      tabId,
      domain,
      screenContext
    });
    return;
  }

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
}

export function registerZoomChangeListener() {
  chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    const { newZoomFactor, oldZoomFactor, tabId, zoomSettings } =
      zoomChangeInfo;
    const normalizedZoomFactor = normalizeZoomFactor(newZoomFactor);
    const zoomPercent = Math.round(normalizedZoomFactor * 100);
    const isSupportedZoomFactor = SUPPORTED_ZOOM_FACTORS.includes(
      normalizedZoomFactor
    );

    console.info("[ScreenSense] tab zoom changed", {
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

    void persistZoomPreference(tabId, payload);
  });
}
