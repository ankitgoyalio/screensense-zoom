import { registerScreenContextListeners } from "./screen-context-events.js";
import { registerZoomChangeListener } from "./zoom-events.js";

function initializeBackground() {
  registerScreenContextListeners();
  registerZoomChangeListener();

  console.info("[ScreenSense] background service worker initialized");
}

initializeBackground();
