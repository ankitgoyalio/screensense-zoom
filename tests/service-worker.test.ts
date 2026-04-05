import { describe, expect, test } from "bun:test";

import {
  getValidWindowId,
  shouldCaptureForTabUpdate
} from "../src/background/service-worker";

describe("service worker event helpers", () => {
  test("accepts real Chrome window ids and rejects special ids", () => {
    expect(getValidWindowId(7)).toBe(7);
    expect(getValidWindowId(undefined)).toBeNull();
    expect(getValidWindowId(-1)).toBeNull();
  });

  test("captures on completed tab updates with a real window id", () => {
    expect(shouldCaptureForTabUpdate({ status: "complete" }, { windowId: 9 })).toBe(true);
    expect(shouldCaptureForTabUpdate({}, { windowId: 9 })).toBe(false);
    expect(shouldCaptureForTabUpdate({ status: "complete" }, { windowId: -1 })).toBe(false);
  });
});
