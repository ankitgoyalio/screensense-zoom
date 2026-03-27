import { registerScreenContextListeners } from "./screen-context-events.js";
import { registerZoomChangeListener } from "./zoom-events.js";

/**
 * Initialize the background service by registering event listeners.
 *
 * Registers screen context and zoom-change listeners and logs an informational message on success or an error with the caught exception on failure.
 */
function initializeBackground() {
  try {
    registerScreenContextListeners();
    registerZoomChangeListener();
    console.info("[ScreenSense] background service worker initialized");
  } catch (error) {
    console.error("[ScreenSense] background initialization failed", error);
  }
}

initializeBackground();
