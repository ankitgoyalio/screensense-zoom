import { describe, expect, test } from "bun:test";

import {
  RESOLUTION_HISTORY_LIMIT,
  formatResolution,
  recordResolution
} from "../src/shared/resolution-history";

describe("resolution history", () => {
  test("formats availWidth and availHeight as a resolution label", () => {
    expect(formatResolution({ width: 1920, height: 1080 })).toBe("1920 x 1080");
  });

  test("adds a new resolution to the front of the list and de-duplicates older entries", () => {
    const nextHistory = recordResolution(
      ["1440 x 900", "1920 x 1080"],
      { width: 1920, height: 1080 }
    );

    expect(nextHistory).toEqual(["1920 x 1080", "1440 x 900"]);
  });

  test("keeps only the most recent entries up to the configured limit", () => {
    const history = Array.from({ length: RESOLUTION_HISTORY_LIMIT }, (_, index) => `${index} x ${index}`);

    const nextHistory = recordResolution(history, { width: 2560, height: 1440 });

    expect(nextHistory).toHaveLength(RESOLUTION_HISTORY_LIMIT);
    expect(nextHistory[0]).toBe("2560 x 1440");
    expect(nextHistory).not.toContain(`${RESOLUTION_HISTORY_LIMIT - 1} x ${RESOLUTION_HISTORY_LIMIT - 1}`);
  });
});
