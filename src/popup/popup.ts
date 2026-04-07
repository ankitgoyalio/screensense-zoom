import {
  normalizeResolutionHistory,
  RESOLUTION_STORAGE_KEY,
  type ResolutionHistoryEntry
} from "../shared/resolution-history.js";

export { RESOLUTION_STORAGE_KEY } from "../shared/resolution-history.js";

export type ResolutionState = {
  helperText: string;
  history: ResolutionHistoryEntry[];
  title: string;
};

const app = typeof document === "undefined"
  ? null
  : document.querySelector<HTMLDivElement>("#app");

function createParagraph(className: string, text: string): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text;
  return paragraph;
}

function formatZoomFactorLabel(zoomFactor: number): string {
  return `${Math.round(zoomFactor * 100)}%`;
}

export function getResolutionState(history: ResolutionHistoryEntry[]): ResolutionState {
  if (history.length === 0) {
    return {
      helperText: "Resize or move a Chrome window to capture a resolution.",
      history: [],
      title: "No resolutions recorded"
    };
  }

  return {
    helperText: "Most recent first.",
    history,
    title: "Observed resolutions"
  };
}

function createResolutionList(history: ResolutionHistoryEntry[]): HTMLUListElement {
  const list = document.createElement("ul");
  list.className = "resolution-list";
  list.setAttribute("aria-label", "Observed screen resolutions");

  for (const entry of history) {
    const listItem = document.createElement("li");
    listItem.className = "resolution-item";

    const value = document.createElement("span");
    value.className = "resolution-value";
    value.textContent = entry.resolution;

    const zoom = document.createElement("span");
    zoom.className = "resolution-zoom";
    zoom.textContent = formatZoomFactorLabel(entry.defaultZoomFactor);

    listItem.append(value, zoom);
    list.appendChild(listItem);
  }

  return list;
}

function renderResolutionState(history: ResolutionHistoryEntry[]): void {
  if (!app) {
    return;
  }

  const state = getResolutionState(history);
  const section = document.createElement("section");
  section.className = "resolution-state";

  const title = createParagraph("state-title", state.title);
  const helper = createParagraph("state-helper", state.helperText);

  section.append(title, helper);

  if (state.history.length > 0) {
    section.append(createResolutionList(state.history));
  }

  app.replaceChildren(section);
}

function renderResolutionList(history: unknown): void {
  if (!app) {
    return;
  }

  renderResolutionState(normalizeResolutionHistory(history));
}

async function loadResolutionHistory(): Promise<void> {
  try {
    const storedState = await chrome.storage.local.get(RESOLUTION_STORAGE_KEY);
    renderResolutionList(storedState[RESOLUTION_STORAGE_KEY]);
  } catch (error) {
    console.error("Failed to load resolution history:", error);
    renderResolutionList([]);
  }
}

if (typeof chrome !== "undefined" && app) {
  void loadResolutionHistory();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !(RESOLUTION_STORAGE_KEY in changes)) {
      return;
    }

    const nextHistory = changes[RESOLUTION_STORAGE_KEY]?.newValue;
    renderResolutionList(nextHistory);
  });
}
