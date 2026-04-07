import { describe, expect, test } from "bun:test";

import {
  getPublicSuffix,
  getRegistrableDomain
} from "../src/shared/public-suffix";

describe("public suffix", () => {
  test("resolves exact ICANN suffix rules", () => {
    expect(getPublicSuffix("app.example.com")).toBe("com");
    expect(getRegistrableDomain("app.example.com")).toBe("example.com");
    expect(getPublicSuffix("shop.example.co.uk")).toBe("co.uk");
    expect(getRegistrableDomain("shop.example.co.uk")).toBe("example.co.uk");
  });

  test("resolves wildcard rules from the public suffix list", () => {
    expect(getPublicSuffix("a.b.test.ck")).toBe("test.ck");
    expect(getRegistrableDomain("a.b.test.ck")).toBe("b.test.ck");
  });

  test("resolves exception rules from the public suffix list", () => {
    expect(getPublicSuffix("www.ck")).toBe("ck");
    expect(getRegistrableDomain("www.ck")).toBe("www.ck");
    expect(getPublicSuffix("www.city.kawasaki.jp")).toBe("kawasaki.jp");
    expect(getRegistrableDomain("www.city.kawasaki.jp")).toBe("city.kawasaki.jp");
  });

  test("resolves private section rules from the public suffix list", () => {
    expect(getPublicSuffix("foo.bar.github.io")).toBe("github.io");
    expect(getRegistrableDomain("foo.bar.github.io")).toBe("bar.github.io");
  });

  test("falls back to the default wildcard rule when no explicit rule matches", () => {
    expect(getPublicSuffix("internal")).toBe("internal");
    expect(getRegistrableDomain("internal")).toBe("internal");
    expect(getPublicSuffix("service.internal")).toBe("internal");
    expect(getRegistrableDomain("service.internal")).toBe("service.internal");
  });
});
