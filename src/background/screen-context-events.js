/* global chrome */

import {
  REPORT_SCREEN_CONTEXT_MESSAGE,
  REQUEST_SCREEN_CONTEXT_MESSAGE
} from "../constants/messages.js";
import {
  removeScreenContextForTab,
  setScreenContextForTab
} from "./screen-context-cache.js";
import { ensureZoomPreferenceForTab } from "./tab-zoom-state.js";

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function requestScreenContext(tabId) {
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
      await ensureContentScript(tabId);
      await chrome.tabs.sendMessage(tabId, {
        type: REQUEST_SCREEN_CONTEXT_MESSAGE
      });
    } catch (injectionError) {
      console.debug("[ScreenSense] unable to request screen context", {
        tabId,
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
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== REPORT_SCREEN_CONTEXT_MESSAGE || !sender.tab?.id) {
      return;
    }

    const tabId = sender.tab.id;
    void (async () => {
      await setScreenContextForTab(tabId, message.payload);
      await ensureZoomPreferenceForTab(tabId);
    })();
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

    void requestScreenContextForActiveTab(window.id);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    void removeScreenContextForTab(tabId);
  });
}
