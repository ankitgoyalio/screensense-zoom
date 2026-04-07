import { describe, expect, test } from "bun:test";

import { createNormalizedScreenContext } from "../src/shared/screen-context";

describe("screen context", () => {
  test("normalizes dimensions so orientation changes map to the same resolution", () => {
    expect(createNormalizedScreenContext({ width: 1080, height: 1920 })).toEqual({
      height: 1080,
      resolutionKey: "1920 x 1080",
      width: 1920
    });
  });

  test("preserves already-landscape dimensions", () => {
    expect(createNormalizedScreenContext({ width: 2560, height: 1440 })).toEqual({
      height: 1440,
      resolutionKey: "2560 x 1440",
      width: 2560
    });
  });
});
