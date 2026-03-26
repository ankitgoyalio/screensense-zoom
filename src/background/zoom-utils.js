export const DEFAULT_ZOOM_FACTOR = 1;

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
