import { describe, expect, test } from "bun:test";

import { getResolutionState } from "../src/popup/popup";

describe("popup ui", () => {
  test("creates an empty state when no history exists", () => {
    expect(getResolutionState([])).toEqual({
      helperText: "Resize or move a Chrome window to capture a resolution.",
      history: [],
      title: "No resolutions recorded"
    });
  });

  test("creates a simple list state from captured resolutions", () => {
    expect(getResolutionState(["2560 x 1440", "1920 x 1080"])).toEqual({
      helperText: "Most recent first.",
      history: ["2560 x 1440", "1920 x 1080"],
      title: "Observed resolutions"
    });
  });
});
