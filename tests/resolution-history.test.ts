import { describe, expect, test } from "bun:test";

import {
  RESOLUTION_HISTORY_LIMIT,
  formatResolution,
  normalizeResolutionHistory,
  recordResolution
} from "../src/shared/resolution-history";

describe("resolution history", () => {
  test("formats width and height as a resolution label", () => {
    expect(formatResolution({ width: 1920, height: 1080 })).toBe("1920 x 1080");
  });

  test("adds a new resolution to the front of the list and de-duplicates older entries", () => {
    const nextHistory = recordResolution(
      [
        { currentZoomFactor: 1, defaultZoomFactor: 1, resolution: "1440 x 900" },
        { currentZoomFactor: 1, defaultZoomFactor: 1, resolution: "1920 x 1080" }
      ],
      { currentZoomFactor: 1.25, defaultZoomFactor: 1, height: 1080, width: 1920 }
    );

    expect(nextHistory).toEqual([
      { currentZoomFactor: 1.25, defaultZoomFactor: 1, resolution: "1920 x 1080" },
      { currentZoomFactor: 1, defaultZoomFactor: 1, resolution: "1440 x 900" }
    ]);
  });

  test("keeps only the most recent entries up to the configured limit", () => {
    const history = Array.from({ length: RESOLUTION_HISTORY_LIMIT }, (_, index) => ({
      currentZoomFactor: 1,
      defaultZoomFactor: 1,
      resolution: `${index} x ${index}`,
    }));

    const nextHistory = recordResolution(history, {
      currentZoomFactor: 1.1,
      defaultZoomFactor: 1,
      height: 1440,
      width: 2560
    });

    expect(nextHistory).toHaveLength(RESOLUTION_HISTORY_LIMIT);
    expect(nextHistory[0]).toEqual({
      currentZoomFactor: 1.1,
      defaultZoomFactor: 1,
      resolution: "2560 x 1440"
    });
    expect(nextHistory).not.toContainEqual({
      currentZoomFactor: 1,
      defaultZoomFactor: 1,
      resolution: `${RESOLUTION_HISTORY_LIMIT - 1} x ${RESOLUTION_HISTORY_LIMIT - 1}`,
    });
  });

  test("normalizes legacy string history into entries with default zoom factors", () => {
    expect(normalizeResolutionHistory(["1920 x 1080", "1440 x 900"])).toEqual([
      { currentZoomFactor: 1, defaultZoomFactor: 1, resolution: "1920 x 1080" },
      { currentZoomFactor: 1, defaultZoomFactor: 1, resolution: "1440 x 900" }
    ]);
  });

  test("normalizes legacy object history by treating saved zoom as current zoom", () => {
    expect(normalizeResolutionHistory([
      { resolution: "1920 x 1080", zoomFactor: 1.5 }
    ])).toEqual([
      { currentZoomFactor: 1.5, defaultZoomFactor: 1, resolution: "1920 x 1080" }
    ]);
  });
});
