# screensense-zoom

Chrome extension baseline for ScreenSense Zoom using Manifest V3, TypeScript, and Bun.

## Install dependencies

```bash
bun install
```

## Run tests

```bash
bun test
```

## Build the extension

```bash
bun run build
```

This creates a loadable extension in `dist/`.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click Load unpacked.
4. Select [dist](dist/).

## Reload workflow

- Reload the extension after changes to `manifest.json` or the background service worker.
- Reopen the popup after changes to popup HTML, CSS, or JS.
