import { beforeAll, describe, expect, test } from "bun:test";

type ExtensionManifest = {
  manifest_version: number;
  action?: {
    default_popup?: string;
    default_title?: string;
  };
  background?: {
    service_worker?: string;
    type?: string;
  };
  host_permissions?: string[];
  icons?: Record<string, string>;
  permissions?: string[];
};

const requiredDistFiles = [
  "dist/manifest.json",
  "dist/popup/popup.html",
  "dist/popup/popup.css",
  "dist/popup/popup.js",
  "dist/background/service-worker.js",
  "dist/icons/icon16.png",
  "dist/icons/icon48.png",
  "dist/icons/icon128.png"
];

beforeAll(async () => {
  await Bun.$`bun run build`;
});

describe("extension baseline", () => {
  test("built manifest defines the MV3 popup and background entry points", async () => {
    const manifest = await Bun.file("dist/manifest.json").json() as ExtensionManifest;

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action?.default_title).toBe("ScreenSense Zoom");
    expect(manifest.action?.default_popup).toBe("popup/popup.html");
    expect(manifest.background?.service_worker).toBe("background/service-worker.js");
    expect(manifest.background?.type).toBe("module");
    expect(manifest.host_permissions).toEqual(["<all_urls>"]);
    expect(manifest.permissions).toEqual(["scripting", "storage", "tabs", "windows"]);
    expect(manifest.icons).toEqual({
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    });
  });

  test("build output contains the files Chrome needs to load the extension", async () => {
    for (const path of requiredDistFiles) {
      expect(await Bun.file(path).exists()).toBe(true);
    }
  });
});
