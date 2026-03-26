/* global chrome */

import {
  SHOW_ZOOM_TOAST_MESSAGE,
  TOAST_LISTENER_READY_FLAG
} from "../constants/messages.js";
import { showZoomToast } from "./toast.js";

if (!globalThis[TOAST_LISTENER_READY_FLAG]) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== SHOW_ZOOM_TOAST_MESSAGE) {
      return;
    }

    showZoomToast(message.payload);
  });

  globalThis[TOAST_LISTENER_READY_FLAG] = true;
}
