import { registerScreenContextListeners } from "./screen-context-events.js";
import { registerZoomChangeListener } from "./zoom-events.js";

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
