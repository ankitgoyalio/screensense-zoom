import { registerZoomChangeListener } from "./zoom-events.js";

function initializeBackground() {
  registerZoomChangeListener();

  console.info("[ScreenSense] background service worker initialized");
}

initializeBackground();
