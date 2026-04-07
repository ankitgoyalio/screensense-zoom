export const RESOLUTION_HISTORY_LIMIT = 10;
export const RESOLUTION_STORAGE_KEY = "windowResolutionHistory";

import { DEFAULT_ZOOM_FACTOR, normalizeZoomFactor } from "./zoom.js";

type ResolutionLike = {
  height?: number;
  width?: number;
};

type ResolutionWithZoom = ResolutionLike & {
  defaultZoomFactor?: number;
  zoomFactor?: number;
};

export type ResolutionHistoryEntry = {
  defaultZoomFactor: number;
  resolution: string;
};

export function formatResolution({ width, height }: ResolutionLike): string {
  return `${width ?? 0} x ${height ?? 0}`;
}

export function hasResolutionBounds(windowState: ResolutionLike): windowState is Required<ResolutionLike> {
  return Number.isFinite(windowState.width) && Number.isFinite(windowState.height);
}

function isResolutionHistoryEntry(value: unknown): value is ResolutionHistoryEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ResolutionHistoryEntry>;
  return (
    typeof candidate.resolution === "string" &&
    Number.isFinite(candidate.defaultZoomFactor)
  );
}

export function normalizeResolutionHistory(history: unknown): ResolutionHistoryEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.flatMap((entry) => {
    if (typeof entry === "string") {
      return [{
        defaultZoomFactor: DEFAULT_ZOOM_FACTOR,
        resolution: entry,
      }];
    }

    if (isResolutionHistoryEntry(entry)) {
      return [{
        defaultZoomFactor: normalizeZoomFactor(entry.defaultZoomFactor),
        resolution: entry.resolution,
      }];
    }

    if (typeof entry === "object" && entry !== null) {
      const legacyEntry = entry as Partial<{ resolution: string; zoomFactor: number }>;
      const legacyZoomFactor = legacyEntry.zoomFactor;

      if (typeof legacyEntry.resolution === "string" && typeof legacyZoomFactor === "number") {
        return [{
          defaultZoomFactor: normalizeZoomFactor(legacyZoomFactor),
          resolution: legacyEntry.resolution
        }];
      }
    }

    return [];
  });
}

export function recordResolution(
  history: ResolutionHistoryEntry[],
  resolution: ResolutionWithZoom,
  limit = RESOLUTION_HISTORY_LIMIT
): ResolutionHistoryEntry[] {
  const formattedResolution = formatResolution(resolution);
  const nextEntry = {
    defaultZoomFactor: normalizeZoomFactor(resolution.defaultZoomFactor ?? DEFAULT_ZOOM_FACTOR),
    resolution: formattedResolution,
  };
  const nextHistory = [
    nextEntry,
    ...history.filter((entry) => entry.resolution !== formattedResolution)
  ];

  return nextHistory.slice(0, limit);
}
