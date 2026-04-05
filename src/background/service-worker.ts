import {
  DOMAIN_ZOOM_STORAGE_KEY,
  getDomainZoomKey,
  updateDomainZoomMap
} from "../shared/domain-zoom.js";
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

const WINDOW_ID_NONE = -1;

export function getValidWindowId(windowId: number | undefined): number | null {
  if (typeof windowId !== "number" || windowId === WINDOW_ID_NONE) {
    return null;
  }

  return windowId;
}

export function shouldCaptureForTabUpdate(
  changeInfo: { status?: string },
  tab: Pick<chrome.tabs.Tab, "windowId">
): boolean {
  return changeInfo.status === "complete" && getValidWindowId(tab.windowId) !== null;
}

async function getActiveTab(
  windowId: number
): Promise<{ tabId: number; url: string | undefined } | null> {
  const tabs = await chrome.tabs.query({
    active: true,
    windowId
  });
  const activeTab = tabs[0];
  const tabId = activeTab?.id;
  const url = activeTab?.url;

  if (typeof tabId !== "number") {
    return null;
  }

  return {
    tabId,
    url
  };
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

async function getZoomStateForTab(tabId: number): Promise<{
  currentZoomFactor: number;
  defaultZoomFactor: number;
}> {
  const currentZoomFactor = normalizeZoomFactor(await chrome.tabs.getZoom(tabId));
  const zoomSettings = await chrome.tabs.getZoomSettings(tabId);

  return {
    currentZoomFactor,
    defaultZoomFactor: normalizeZoomFactor(zoomSettings.defaultZoomFactor ?? 1)
  };
}

export function getDomainZoomPayload(
  url: string | undefined,
  zoomState: {
    currentZoomFactor: number;
    defaultZoomFactor: number;
  }
): {
  defaultZoomFactor: number;
  domainKey: string;
  zoomFactor: number;
} | null {
  const domainKey = getDomainZoomKey(url);

  if (domainKey === null) {
    return null;
  }

  return {
    defaultZoomFactor: zoomState.defaultZoomFactor,
    domainKey,
    zoomFactor: zoomState.currentZoomFactor
  };
}

export function shouldPersistZoomChange(
  zoomChangeInfo: {
    newZoomFactor: number;
    oldZoomFactor: number;
    tabId: number;
    zoomSettings: {
      defaultZoomFactor?: number;
    };
  },
  tabUrl: string | undefined
): boolean {
  return getDomainZoomPayload(tabUrl, {
    currentZoomFactor: zoomChangeInfo.newZoomFactor,
    defaultZoomFactor: normalizeZoomFactor(zoomChangeInfo.zoomSettings.defaultZoomFactor ?? 1)
  }) !== null;
}

async function persistDomainZoomForTab(
  url: string | undefined,
  zoomState: {
    currentZoomFactor: number;
    defaultZoomFactor: number;
  }
): Promise<void> {
  const domainZoomPayload = getDomainZoomPayload(url, zoomState);

  if (domainZoomPayload === null) {
    return;
  }

  const storedState = await chrome.storage.local.get(DOMAIN_ZOOM_STORAGE_KEY);
  const domainZoomMap =
    typeof storedState[DOMAIN_ZOOM_STORAGE_KEY] === "object" && storedState[DOMAIN_ZOOM_STORAGE_KEY] !== null
      ? storedState[DOMAIN_ZOOM_STORAGE_KEY] as Record<string, number>
      : {};

  await chrome.storage.local.set({
    [DOMAIN_ZOOM_STORAGE_KEY]: updateDomainZoomMap(
      domainZoomMap,
      domainZoomPayload.domainKey,
      domainZoomPayload.zoomFactor,
      domainZoomPayload.defaultZoomFactor
    )
  });
}

async function persistResolutionForWindow(windowId: number): Promise<void> {
  const activeTab = await getActiveTab(windowId);

  if (activeTab === null) {
    return;
  }

  const screenDimensions = await getScreenDimensionsFromTab(activeTab.tabId);

  if (screenDimensions === null) {
    return;
  }

  const normalizedScreenContext = createNormalizedScreenContext({
    height: screenDimensions.availHeight,
    width: screenDimensions.availWidth
  });
  const zoomState = await getZoomStateForTab(activeTab.tabId);
  const storedState = await chrome.storage.local.get(RESOLUTION_STORAGE_KEY);
  const history = normalizeResolutionHistory(storedState[RESOLUTION_STORAGE_KEY]);

  await chrome.storage.local.set({
    [RESOLUTION_STORAGE_KEY]: recordResolution(history, {
      ...normalizedScreenContext,
      defaultZoomFactor: zoomState.defaultZoomFactor
    })
  });

  await persistDomainZoomForTab(activeTab.url, zoomState);
}

const windowBoundsDebouncer = createWindowBoundsDebouncer({
  run(windowId) {
    void persistResolutionForWindow(windowId);
  }
});

function scheduleResolutionCapture(windowId: number | undefined): void {
  const validWindowId = getValidWindowId(windowId);

  if (validWindowId === null) {
    return;
  }

  windowBoundsDebouncer.schedule(validWindowId);
}

if (typeof chrome !== "undefined") {
  chrome.windows.onBoundsChanged.addListener((chromeWindow) => {
    scheduleResolutionCapture(chromeWindow.id);
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    scheduleResolutionCapture(activeInfo.windowId);
  });

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (!shouldCaptureForTabUpdate(changeInfo, tab)) {
      return;
    }

    scheduleResolutionCapture(tab.windowId);
  });

  chrome.windows.onFocusChanged.addListener((windowId) => {
    scheduleResolutionCapture(windowId);
  });

  chrome.tabs.onZoomChange.addListener((zoomChangeInfo) => {
    void (async () => {
      const tab = await chrome.tabs.get(zoomChangeInfo.tabId);

      if (!shouldPersistZoomChange(zoomChangeInfo, tab.url)) {
        return;
      }

      await persistDomainZoomForTab(tab.url, {
        currentZoomFactor: normalizeZoomFactor(zoomChangeInfo.newZoomFactor),
        defaultZoomFactor: normalizeZoomFactor(zoomChangeInfo.zoomSettings.defaultZoomFactor ?? 1)
      });
    })();
  });
}
