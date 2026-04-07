import { describe, expect, test } from "bun:test";

import {
  DOMAIN_ZOOM_STORAGE_KEY,
  getDomainZoomKey,
  updateDomainZoomMap
} from "../src/shared/domain-zoom";

describe("domain zoom", () => {
  test("exposes the storage key for domain zoom preferences", () => {
    expect(DOMAIN_ZOOM_STORAGE_KEY).toBe("domainZoomFactors");
  });

  test("derives a domain zoom key from the active tab url", () => {
    expect(getDomainZoomKey("https://app.example.com/dashboard")).toBe("example.com");
    expect(getDomainZoomKey("https://shop.example.co.uk/products")).toBe("example.co.uk");
    expect(getDomainZoomKey("https://portal.example.com.au/login")).toBe("example.com.au");
    expect(getDomainZoomKey("https://localhost:3000/test")).toBe("localhost");
    expect(getDomainZoomKey("chrome://extensions")).toBeNull();
  });

  test("stores domain zoom only when it differs from the default zoom", () => {
    expect(updateDomainZoomMap({}, "example.com", 1.5, 1)).toEqual({
      "example.com": 1.5
    });
    expect(updateDomainZoomMap({ "example.com": 1.5 }, "example.com", 1, 1)).toEqual({});
  });
});
