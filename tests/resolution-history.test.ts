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
        { resolution: "1440 x 900", zoomFactor: 1 },
        { resolution: "1920 x 1080", zoomFactor: 1 }
      ],
      { height: 1080, width: 1920, zoomFactor: 1.25 }
    );

    expect(nextHistory).toEqual([
      { resolution: "1920 x 1080", zoomFactor: 1.25 },
      { resolution: "1440 x 900", zoomFactor: 1 }
    ]);
  });

  test("keeps only the most recent entries up to the configured limit", () => {
    const history = Array.from({ length: RESOLUTION_HISTORY_LIMIT }, (_, index) => ({
      resolution: `${index} x ${index}`,
      zoomFactor: 1
    }));

    const nextHistory = recordResolution(history, { height: 1440, width: 2560, zoomFactor: 1.1 });

    expect(nextHistory).toHaveLength(RESOLUTION_HISTORY_LIMIT);
    expect(nextHistory[0]).toEqual({ resolution: "2560 x 1440", zoomFactor: 1.1 });
    expect(nextHistory).not.toContainEqual({
      resolution: `${RESOLUTION_HISTORY_LIMIT - 1} x ${RESOLUTION_HISTORY_LIMIT - 1}`,
      zoomFactor: 1
    });
  });

  test("normalizes legacy string history into entries with the default zoom factor", () => {
    expect(normalizeResolutionHistory(["1920 x 1080", "1440 x 900"])).toEqual([
      { resolution: "1920 x 1080", zoomFactor: 1 },
      { resolution: "1440 x 900", zoomFactor: 1 }
    ]);
  });
});
