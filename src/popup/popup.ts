export {};

const RESOLUTION_STORAGE_KEY = "windowResolutionHistory";

const app = document.querySelector<HTMLDivElement>("#app");

function renderResolutionList(history: string[]): void {
  if (!app) {
    return;
  }

  if (history.length === 0) {
    app.innerHTML = `
      <p class="empty-state">
        Resize or move a Chrome window to capture a resolution.
      </p>
    `;
    return;
  }

  const listItems = history
    .map((resolution) => `<li class="resolution-item">${resolution}</li>`)
    .join("");

  app.innerHTML = `
    <ul class="resolution-list" aria-label="Observed screen resolutions">
      ${listItems}
    </ul>
  `;
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
