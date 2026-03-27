import { beforeEach, expect, test } from "bun:test";

const ZOOM_RULES_STORAGE_KEY = "zoomRulesByDomainAndResolution";
const PENDING_ZOOM_RULES_STORAGE_KEY = "pendingZoomRulesByDomainAndResolution";

let storageState;
let failActiveWrites;

function installChromeStorageMock() {
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) {
          return {
            [key]: storageState[key]
          };
        },
        async set(values) {
          if (ZOOM_RULES_STORAGE_KEY in values && failActiveWrites > 0) {
            failActiveWrites -= 1;
            throw new Error("simulated active rules write failure");
          }

          Object.assign(storageState, structuredClone(values));
        },
        async remove(key) {
          delete storageState[key];
        }
      }
    }
  };
}

async function importZoomStoreModule() {
  return await import(`../../src/background/zoom-store.js?test=${Date.now()}-${Math.random()}`);
}

beforeEach(() => {
  storageState = {};
  failActiveWrites = 0;
  installChromeStorageMock();
});

test("saveZoomPreference keeps pending rules when committed write fails", async () => {
  const existingRuleKey = "example.com::1920x1080";
  const nextRuleKey = "example.com::2560x1440";

  storageState[ZOOM_RULES_STORAGE_KEY] = {
    [existingRuleKey]: {
      domain: "example.com",
      resolutionKey: "1920x1080",
      normalizedScreenWidth: 1920,
      normalizedScreenHeight: 1080,
      zoomFactor: 1.1,
      zoomPercent: 110,
      updatedAt: 1
    }
  };

  failActiveWrites = 1;

  const zoomStore = await importZoomStoreModule();

  await expect(
    zoomStore.saveZoomPreference({
      domain: "example.com",
      resolutionKey: "2560x1440",
      normalizedScreenWidth: 2560,
      normalizedScreenHeight: 1440,
      zoomFactor: 1.25,
      zoomPercent: 125
    })
  ).rejects.toThrow("simulated active rules write failure");

  expect(storageState[ZOOM_RULES_STORAGE_KEY]).toEqual({
    [existingRuleKey]: {
      domain: "example.com",
      resolutionKey: "1920x1080",
      normalizedScreenWidth: 1920,
      normalizedScreenHeight: 1080,
      zoomFactor: 1.1,
      zoomPercent: 110,
      updatedAt: 1
    }
  });
  expect(storageState[PENDING_ZOOM_RULES_STORAGE_KEY][nextRuleKey]).toMatchObject({
    domain: "example.com",
    resolutionKey: "2560x1440",
    zoomFactor: 1.25,
    zoomPercent: 125
  });
});

test("module startup flushes pending rules after a prior partial write", async () => {
  const pendingRuleKey = "example.com::2560x1440";

  storageState[PENDING_ZOOM_RULES_STORAGE_KEY] = {
    [pendingRuleKey]: {
      domain: "example.com",
      resolutionKey: "2560x1440",
      normalizedScreenWidth: 2560,
      normalizedScreenHeight: 1440,
      zoomFactor: 1.25,
      zoomPercent: 125,
      updatedAt: 2
    }
  };

  const zoomStore = await importZoomStoreModule();
  const preference = await zoomStore.getSavedZoomPreference({
    domain: "example.com",
    resolutionKey: "2560x1440"
  });

  expect(preference).toMatchObject({
    domain: "example.com",
    resolutionKey: "2560x1440",
    zoomFactor: 1.25,
    zoomPercent: 125
  });
  expect(storageState[ZOOM_RULES_STORAGE_KEY][pendingRuleKey]).toMatchObject({
    domain: "example.com",
    resolutionKey: "2560x1440",
    zoomFactor: 1.25,
    zoomPercent: 125
  });
  expect(storageState[PENDING_ZOOM_RULES_STORAGE_KEY]).toBeUndefined();
});
