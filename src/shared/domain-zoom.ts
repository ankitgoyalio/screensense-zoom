import { normalizeZoomFactor } from "./zoom.js";
import { getRegistrableDomain } from "./public-suffix.js";

export const DOMAIN_ZOOM_STORAGE_KEY = "domainZoomFactors";

export type DomainZoomMap = Record<string, number>;

export function getDomainZoomKey(url: string | undefined): string | null {
  if (typeof url !== "string" || url.length === 0) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.length === 0) {
      return null;
    }

    if (hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return hostname;
    }

    return getRegistrableDomain(hostname);
  } catch {
    return null;
  }
}

export function updateDomainZoomMap(
  currentMap: DomainZoomMap,
  domainKey: string,
  currentZoomFactor: number,
  defaultZoomFactor: number
): DomainZoomMap {
  const nextMap = { ...currentMap };
  const normalizedCurrentZoom = normalizeZoomFactor(currentZoomFactor);
  const normalizedDefaultZoom = normalizeZoomFactor(defaultZoomFactor);

  if (normalizedCurrentZoom === normalizedDefaultZoom) {
    delete nextMap[domainKey];
    return nextMap;
  }

  nextMap[domainKey] = normalizedCurrentZoom;
  return nextMap;
}
