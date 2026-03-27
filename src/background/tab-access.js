/* global chrome */

const SUPPORTED_HOST_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Create a standardized access result describing tab access state and reason.
 * @param {boolean} canAccess - `true` if access is allowed, `false` otherwise.
 * @param {string} reason - Short machine-readable reason code explaining the decision.
 * @returns {{canAccess: boolean, reason: string}} The access result object.
 */
function createAccessResult(canAccess, reason) {
  return { canAccess, reason };
}

/**
 * Retrieve the URL string from a tab object if present.
 * @param {object|undefined} tab - Chrome tab object or undefined.
 * @return {string|undefined} The tab's `url` string if `tab?.url` is a string, `undefined` otherwise.
 */
function getTabUrl(tab) {
  return typeof tab?.url === "string" ? tab.url : undefined;
}

/**
 * Checks whether the extension has host permission for the given origin.
 * @param {string} origin - Origin to check (scheme + host, optional port), e.g. "https://example.com".
 * @returns {boolean} `true` if permission for `${origin}/*` is present, `false` if absent or the check fails.
 */
async function hasHostPermissionForOrigin(origin) {
  try {
    return await chrome.permissions.contains({
      origins: [`${origin}/*`]
    });
  } catch (error) {
    console.debug("[ScreenSense] failed to check host permission", {
      origin,
      error
    });
    return false;
  }
}

/**
 * Determine whether the extension can access the given tab's URL and provide a concise reason.
 *
 * @param {import('chrome').tabs.Tab|Object} tab - Tab object; only the `url` property is inspected.
 * @returns {{canAccess: boolean, reason: string}} An object where `canAccess` is `true` if access is allowed, `false` otherwise. `reason` is `"allowed"` when access is granted, or one of: `"missing_url"`, `"invalid_url"`, `"unsupported_scheme:<protocol>"`, or `"missing_host_permission"`.
 */
export async function getTabAccessState(tab) {
  const url = getTabUrl(tab);

  if (!url) {
    return createAccessResult(false, "missing_url");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return createAccessResult(false, "invalid_url");
  }

  if (!SUPPORTED_HOST_PROTOCOLS.has(parsedUrl.protocol)) {
    return createAccessResult(false, `unsupported_scheme:${parsedUrl.protocol}`);
  }

  const hasHostPermission = await hasHostPermissionForOrigin(parsedUrl.origin);

  if (!hasHostPermission) {
    return createAccessResult(false, "missing_host_permission");
  }

  return createAccessResult(true, "allowed");
}
