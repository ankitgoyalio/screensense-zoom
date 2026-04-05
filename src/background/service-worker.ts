import {
  normalizeResolutionHistory,
  recordResolution,
  RESOLUTION_STORAGE_KEY
} from "../shared/resolution-history.js";
import { normalizeZoomFactor } from "../shared/zoom.js";
import { createNormalizedScreenContext } from "../shared/screen-context.js";
import { createWindowBoundsDebouncer } from "../shared/window-bounds-debounce.js";

type WindowScreenDimensions = {
  availHeight: number;
  availWidth: number;
};

async function getActiveTabId(windowId: number): Promise<number | null> {
  const tabs = await chrome.tabs.query({
    active: true,
    windowId
  });
  const tabId = tabs[0]?.id;

  return typeof tabId === "number" ? tabId : null;
}

async function getScreenDimensionsFromTab(tabId: number): Promise<WindowScreenDimensions | null> {
  try {
    const executionResults = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        availHeight: window.screen.availHeight,
        availWidth: window.screen.availWidth
      })
    });

    const result = executionResults[0]?.result;

    if (
      !result ||
      !Number.isFinite(result.availWidth) ||
      !Number.isFinite(result.availHeight)
    ) {
      return null;
    }

    return {
      availHeight: result.availHeight,
      availWidth: result.availWidth
    };
  } catch {
    return null;
  }
}

async function persistResolutionForWindow(windowId: number): Promise<void> {
  const tabId = await getActiveTabId(windowId);

  if (tabId === null) {
    return;
  }

  const screenDimensions = await getScreenDimensionsFromTab(tabId);

  if (screenDimensions === null) {
    return;
  }

  const normalizedScreenContext = createNormalizedScreenContext({
    height: screenDimensions.availHeight,
    width: screenDimensions.availWidth
  });
  const zoomFactor = normalizeZoomFactor(await chrome.tabs.getZoom(tabId));
  const storedState = await chrome.storage.local.get(RESOLUTION_STORAGE_KEY);
  const history = normalizeResolutionHistory(storedState[RESOLUTION_STORAGE_KEY]);

  await chrome.storage.local.set({
    [RESOLUTION_STORAGE_KEY]: recordResolution(history, {
      ...normalizedScreenContext,
      zoomFactor
    })
  });
}

const windowBoundsDebouncer = createWindowBoundsDebouncer({
  run(windowId) {
    void persistResolutionForWindow(windowId);
  }
});

chrome.windows.onBoundsChanged.addListener((chromeWindow) => {
  if (typeof chromeWindow.id !== "number") {
    return;
  }

  windowBoundsDebouncer.schedule(chromeWindow.id);
});
