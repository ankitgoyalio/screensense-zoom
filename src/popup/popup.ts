export const RESOLUTION_STORAGE_KEY = "windowResolutionHistory";

export type ResolutionState = {
  helperText: string;
  history: string[];
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

export function getResolutionState(history: string[]): ResolutionState {
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

function createResolutionList(history: string[]): HTMLUListElement {
  const list = document.createElement("ul");
  list.className = "resolution-list";
  list.setAttribute("aria-label", "Observed screen resolutions");

  for (const resolution of history) {
    const listItem = document.createElement("li");
    listItem.className = "resolution-item";
    const value = document.createElement("span");
    value.className = "resolution-value";
    value.textContent = resolution;

    listItem.append(value);
    list.appendChild(listItem);
  }

  return list;
}

function renderResolutionState(history: string[]): void {
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

function renderResolutionList(history: string[]): void {
  if (!app) {
    return;
  }

  renderResolutionState(history);
}

async function loadResolutionHistory(): Promise<void> {
  const storedState = await chrome.storage.local.get(RESOLUTION_STORAGE_KEY);
  const history = Array.isArray(storedState[RESOLUTION_STORAGE_KEY])
    ? storedState[RESOLUTION_STORAGE_KEY] as string[]
    : [];

  renderResolutionList(history);
}

if (typeof chrome !== "undefined" && app) {
  void loadResolutionHistory();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !(RESOLUTION_STORAGE_KEY in changes)) {
      return;
    }

    const nextHistory = changes[RESOLUTION_STORAGE_KEY]?.newValue;
    renderResolutionList(Array.isArray(nextHistory) ? nextHistory as string[] : []);
  });
}
