import { describe, expect, test } from "bun:test";

import {
  DEFAULT_ZOOM_FACTOR,
  SUPPORTED_ZOOM_FACTORS,
  normalizeZoomFactor
} from "../src/shared/zoom";

describe("zoom", () => {
  test("exposes the supported zoom factors used by the extension", () => {
    expect(SUPPORTED_ZOOM_FACTORS).toEqual([
      0.25,
      1 / 3,
      0.5,
      2 / 3,
      0.75,
      0.8,
      0.9,
      1,
      1.1,
      1.25,
      1.5,
      1.75,
      2,
      2.5,
      3,
      4,
      5
    ]);
    expect(DEFAULT_ZOOM_FACTOR).toBe(1);
  });

  test("normalizes values that are near a supported zoom factor", () => {
    expect(normalizeZoomFactor(1.2498)).toBe(1.25);
  });

  test("rounds unsupported zoom values to two decimals", () => {
    expect(normalizeZoomFactor(1.234)).toBe(1.23);
  });
});
