/* global chrome */

import {
  CONTENT_LISTENER_READY_FLAG,
  REPORT_SCREEN_CONTEXT_MESSAGE,
  REQUEST_SCREEN_CONTEXT_MESSAGE
} from "../constants/messages.js";

/**
 * Produces a normalized screen context by ordering available screen dimensions and building a resolution key.
 *
 * @returns {Object} The screen context.
 * @returns {number} returns.normalizedScreenWidth - The larger of `window.screen.availWidth` and `window.screen.availHeight`.
 * @returns {number} returns.normalizedScreenHeight - The smaller of `window.screen.availWidth` and `window.screen.availHeight`.
 * @returns {string} returns.resolutionKey - Resolution formatted as `"{width}x{height}"` using the normalized dimensions.
 */
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

/**
 * Reports the current normalized screen context to the extension, avoiding duplicate reports unless forced.
 *
 * Sends a message containing the normalized screen width/height and resolution key; if `force` is false
 * the function returns early when the resolution key matches the last reported value. Failures to send
 * are logged with `console.debug`; errors whose message includes "Extension context invalidated" are ignored.
 *
 * @param {boolean} [force=false] - When true, bypasses the duplicate-check and forces a report.
 */
function reportScreenContext(force = false) {
  const screenContext = createNormalizedScreenContext();

  if (!force && lastReportedResolutionKey === screenContext.resolutionKey) {
    return;
  }

  try {
    chrome.runtime
      .sendMessage({
        type: REPORT_SCREEN_CONTEXT_MESSAGE,
        payload: screenContext
      })
      .then(() => {
        lastReportedResolutionKey = screenContext.resolutionKey;
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
