import { describe, expect, test } from "bun:test";

import {
  getDomainZoomPayload,
  getValidWindowId,
  serializeStorageMutation,
  shouldCaptureForTabUpdate,
  shouldPersistZoomChange
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

  test("creates a domain zoom payload only when the tab has a storable domain", () => {
    expect(getDomainZoomPayload("https://app.example.com/home", {
      currentZoomFactor: 1.5,
      defaultZoomFactor: 1
    })).toEqual({
      domainKey: "example.com",
      zoomFactor: 1.5,
      defaultZoomFactor: 1
    });
    expect(getDomainZoomPayload(undefined, {
      currentZoomFactor: 1.5,
      defaultZoomFactor: 1
    })).toBeNull();
  });

  test("persists zoom changes only when the tab has a usable url", () => {
    expect(shouldPersistZoomChange({
      newZoomFactor: 1.5,
      oldZoomFactor: 1,
      tabId: 7,
      zoomSettings: {
        defaultZoomFactor: 1
      }
    }, "https://app.example.com/home")).toBe(true);
    expect(shouldPersistZoomChange({
      newZoomFactor: 1,
      oldZoomFactor: 1.5,
      tabId: 7,
      zoomSettings: {
        defaultZoomFactor: 1
      }
    }, undefined)).toBe(false);
  });

  test("serializes storage mutations that target the same key", async () => {
    const events: string[] = [];

    const firstMutation = serializeStorageMutation("resolution-history", async () => {
      events.push("first:start");
      await new Promise((resolve) => setTimeout(resolve, 5));
      events.push("first:end");
    });
    const secondMutation = serializeStorageMutation("resolution-history", async () => {
      events.push("second:start");
      events.push("second:end");
    });

    await Promise.all([firstMutation, secondMutation]);

    expect(events).toEqual([
      "first:start",
      "first:end",
      "second:start",
      "second:end"
    ]);
  });
});
