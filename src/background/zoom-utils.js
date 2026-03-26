export const DEFAULT_ZOOM_FACTOR = 1;

export function getDomainFromUrl(url) {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
