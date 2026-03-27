/* global chrome */

import {
  CONTENT_LISTENER_READY_FLAG,
  REPORT_SCREEN_CONTEXT_MESSAGE,
  REQUEST_SCREEN_CONTEXT_MESSAGE
} from "../constants/messages.js";

function createNormalizedScreenContext() {
  const width = window.screen.availWidth;
  const height = window.screen.availHeight;
  const normalizedScreenWidth = Math.max(width, height);
  const normalizedScreenHeight = Math.min(width, height);

  return {
    normalizedScreenWidth,
    normalizedScreenHeight,
    resolutionKey: `${normalizedScreenWidth}x${normalizedScreenHeight}`
  };
}

let lastReportedResolutionKey;
let resizeTimeout;

function reportScreenContext(force = false) {
  const screenContext = createNormalizedScreenContext();

  if (!force && lastReportedResolutionKey === screenContext.resolutionKey) {
    return;
  }

  lastReportedResolutionKey = screenContext.resolutionKey;

  try {
    chrome.runtime
      .sendMessage({
        type: REPORT_SCREEN_CONTEXT_MESSAGE,
        payload: screenContext
      })
      .catch((error) => {
        console.debug("[ScreenSense] failed to report screen context", error);
      });
  } catch (error) {
    if (error?.message?.includes("Extension context invalidated")) {
      return;
    }

    console.debug("[ScreenSense] failed to report screen context", error);
  }
}

if (!globalThis[CONTENT_LISTENER_READY_FLAG]) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === REQUEST_SCREEN_CONTEXT_MESSAGE) {
      reportScreenContext(true);
    }
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      reportScreenContext();
    }, 150);
  });

  window.addEventListener("pageshow", () => {
    reportScreenContext(true);
  });

  reportScreenContext(true);
  globalThis[CONTENT_LISTENER_READY_FLAG] = true;
}
