import { describe, expect, test } from "bun:test";

import {
  getResolutionState,
  RESOLUTION_STORAGE_KEY as popupResolutionStorageKey
} from "../src/popup/popup";
import { RESOLUTION_STORAGE_KEY as sharedResolutionStorageKey } from "../src/shared/resolution-history";

describe("popup ui", () => {
  test("creates an empty state when no history exists", () => {
    expect(getResolutionState([])).toEqual({
      helperText: "Resize or move a Chrome window to capture a resolution.",
      history: [],
      title: "No resolutions recorded"
    });
  });

  test("creates a simple list state from captured resolutions", () => {
    expect(getResolutionState([
      { defaultZoomFactor: 1, resolution: "2560 x 1440" },
      { defaultZoomFactor: 1, resolution: "1920 x 1080" }
    ])).toEqual({
      helperText: "Most recent first.",
      history: [
        { defaultZoomFactor: 1, resolution: "2560 x 1440" },
        { defaultZoomFactor: 1, resolution: "1920 x 1080" }
      ],
      title: "Observed resolutions"
    });
  });

  test("re-exports the shared resolution storage key", () => {
    expect(popupResolutionStorageKey).toBe(sharedResolutionStorageKey);
  });
});
