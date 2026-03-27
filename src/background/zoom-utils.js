export const DEFAULT_ZOOM_FACTOR = 1;

/**
 * Extracts the hostname (domain) from a URL string.
 * @param {string} url - The URL string to parse.
 * @returns {string|undefined} The hostname if present, or `undefined` when `url` is falsy or cannot be parsed as a valid URL.
 */
export function getDomainFromUrl(url) {
  if (!url) {
    return undefined;
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname || undefined;
  } catch {
    return undefined;
  }
}
