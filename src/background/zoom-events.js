/* global chrome */

import {
  normalizeZoomFactor,
  SUPPORTED_ZOOM_FACTORS
} from "../constants/zoom.js";
import { SHOW_ZOOM_TOAST_MESSAGE } from "../constants/messages.js";

async function sendZoomToastMessage(tabId, payload) {
  await chrome.tabs.sendMessage(tabId, {
    type: SHOW_ZOOM_TOAST_MESSAGE,
    payload
  });
}

async function ensureToastContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function notifyTabZoomChanged(tabId, payload) {
  try {
    await sendZoomToastMessage(tabId, payload);
  } catch (error) {
    console.debug("[ScreenSense] toast delivery missed existing tab, injecting", {
      tabId,
      message: error?.message
    });

    try {
      await ensureToastContentScript(tabId);
      await sendZoomToastMessage(tabId, payload);
    } catch (injectionError) {
      console.debug("[ScreenSense] unable to inject zoom toast", {
        tabId,
        message: injectionError?.message
      });
    }
  }
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

    void notifyTabZoomChanged(tabId, {
      normalizedZoomFactor,
      zoomPercent,
      isSupportedZoomFactor
    });
  });
}
