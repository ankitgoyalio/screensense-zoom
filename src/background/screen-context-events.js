/* global chrome */

import {
  REPORT_SCREEN_CONTEXT_MESSAGE,
  REQUEST_SCREEN_CONTEXT_MESSAGE
} from "../constants/messages.js";
import {
  removeScreenContextForTab,
  setScreenContextForTab
} from "./screen-context-cache.js";
import { getTabAccessState } from "./tab-access.js";
import { ensureZoomPreferenceForTab } from "./tab-zoom-state.js";

let listenersRegistered = false;
const boundsChangeTimeouts = new Map();
const BOUNDS_CHANGE_DEBOUNCE_MS = 200;

async function ensureContentScript(tab) {
  if (!tab?.id) {
    throw new Error("missing tab id for content script injection");
  }

  const accessState = await getTabAccessState(tab);

  if (!accessState.canAccess) {
    throw new Error(`injection skipped: ${accessState.reason}`);
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
}

async function requestScreenContext(tabId) {
  let tab;

  try {
    tab = await chrome.tabs.get(tabId);
  } catch (error) {
    console.debug("[ScreenSense] unable to load tab for screen context", {
      tabId,
      message: error?.message
    });
    return;
  }

  const accessState = await getTabAccessState(tab);

  if (!accessState.canAccess) {
    console.debug("[ScreenSense] skipped screen context request for inaccessible tab", {
      tabId,
      url: tab.url,
      reason: accessState.reason
    });
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: REQUEST_SCREEN_CONTEXT_MESSAGE
    });
  } catch (error) {
    console.debug("[ScreenSense] screen context request missed tab, injecting", {
      tabId,
      message: error?.message
    });

    try {
      await ensureContentScript(tab);
      await chrome.tabs.sendMessage(tabId, {
        type: REQUEST_SCREEN_CONTEXT_MESSAGE
      });
    } catch (injectionError) {
      console.debug("[ScreenSense] unable to request screen context", {
        tabId,
        url: tab.url,
        message: injectionError?.message
      });
    }
  }
}

async function requestScreenContextForActiveTab(windowId) {
  const tabs = await chrome.tabs.query({
    active: true,
    windowId
  });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    return;
  }

  await requestScreenContext(activeTab.id);
}

export function registerScreenContextListeners() {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== REPORT_SCREEN_CONTEXT_MESSAGE || !sender.tab?.id) {
      return;
    }

    const { payload } = message;

    if (
      typeof payload?.normalizedScreenWidth !== "number" ||
      typeof payload?.normalizedScreenHeight !== "number" ||
      typeof payload?.resolutionKey !== "string"
    ) {
      console.debug("[ScreenSense] invalid screen context payload", {
        tabId: sender.tab.id,
        payload
      });
      return;
    }

    const tabId = sender.tab.id;
    void (async () => {
      await setScreenContextForTab(tabId, payload);
      await ensureZoomPreferenceForTab(tabId);
    })().catch((error) => {
      console.debug("[ScreenSense] failed to process screen context", {
        tabId,
        error
      });
    });
  });

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    void requestScreenContext(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== "complete") {
      return;
    }

    void requestScreenContext(tabId);
  });

  chrome.windows.onBoundsChanged.addListener((window) => {
    if (typeof window.id !== "number") {
      return;
    }

    clearTimeout(boundsChangeTimeouts.get(window.id));
    boundsChangeTimeouts.set(window.id, setTimeout(() => {
      boundsChangeTimeouts.delete(window.id);
      void requestScreenContextForActiveTab(window.id);
    }, BOUNDS_CHANGE_DEBOUNCE_MS));
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void removeScreenContextForTab(tabId);
  });

  chrome.windows.onRemoved.addListener((windowId) => {
    const timeout = boundsChangeTimeouts.get(windowId);

    if (timeout !== undefined) {
      clearTimeout(timeout);
      boundsChangeTimeouts.delete(windowId);
    }
  });
}
