export {};

const RESOLUTION_STORAGE_KEY = "windowResolutionHistory";

const app = document.querySelector<HTMLDivElement>("#app");

function createParagraph(className: string, text: string): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  paragraph.textContent = text;
  return paragraph;
}

function renderEmptyState(): void {
  if (!app) {
    return;
  }

  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.append(
    createParagraph("empty-kicker", "Awaiting signal"),
    createParagraph("empty-copy", "Resize or move a Chrome window to capture a resolution.")
  );

  app.replaceChildren(emptyState);
}

function renderResolutionItems(history: string[]): void {
  if (!app) {
    return;
  }

  const list = document.createElement("ul");
  list.className = "resolution-list";
  list.setAttribute("aria-label", "Observed screen resolutions");

  for (const [index, resolution] of history.entries()) {
    const listItem = document.createElement("li");
    listItem.className = "resolution-item";

    const indexLabel = document.createElement("span");
    indexLabel.className = "resolution-index";
    indexLabel.textContent = String(index + 1).padStart(2, "0");

    const value = document.createElement("span");
    value.className = "resolution-value";
    value.textContent = resolution;

    listItem.append(indexLabel, value);
    list.appendChild(listItem);
  }

  app.replaceChildren(list);
}

function renderResolutionList(history: string[]): void {
  if (!app) {
    return;
  }

  if (history.length === 0) {
    renderEmptyState();
    return;
  }

  renderResolutionItems(history);
}

async function loadResolutionHistory(): Promise<void> {
  const storedState = await chrome.storage.local.get(RESOLUTION_STORAGE_KEY);
  const history = Array.isArray(storedState[RESOLUTION_STORAGE_KEY])
    ? storedState[RESOLUTION_STORAGE_KEY] as string[]
    : [];

  renderResolutionList(history);
}

void loadResolutionHistory();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !(RESOLUTION_STORAGE_KEY in changes)) {
    return;
  }

  const nextHistory = changes[RESOLUTION_STORAGE_KEY]?.newValue;
  renderResolutionList(Array.isArray(nextHistory) ? nextHistory as string[] : []);
});
