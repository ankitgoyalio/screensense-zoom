/* global chrome */

const SUPPORTED_HOST_PROTOCOLS = new Set(["http:", "https:"]);

function createAccessResult(canAccess, reason) {
  return { canAccess, reason };
}

function getTabUrl(tab) {
  return typeof tab?.url === "string" ? tab.url : undefined;
}

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
