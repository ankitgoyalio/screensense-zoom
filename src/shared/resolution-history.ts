export const RESOLUTION_HISTORY_LIMIT = 10;
export const RESOLUTION_STORAGE_KEY = "windowResolutionHistory";

import { DEFAULT_ZOOM_FACTOR, normalizeZoomFactor } from "./zoom.js";

type ResolutionLike = {
  height?: number;
  width?: number;
};

type ResolutionWithZoom = ResolutionLike & {
  zoomFactor?: number;
};

export type ResolutionHistoryEntry = {
  resolution: string;
  zoomFactor: number;
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
  return typeof candidate.resolution === "string" && Number.isFinite(candidate.zoomFactor);
}

export function normalizeResolutionHistory(history: unknown): ResolutionHistoryEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.flatMap((entry) => {
    if (typeof entry === "string") {
      return [{
        resolution: entry,
        zoomFactor: DEFAULT_ZOOM_FACTOR
      }];
    }

    if (isResolutionHistoryEntry(entry)) {
      return [{
        resolution: entry.resolution,
        zoomFactor: normalizeZoomFactor(entry.zoomFactor)
      }];
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
    resolution: formattedResolution,
    zoomFactor: normalizeZoomFactor(resolution.zoomFactor ?? DEFAULT_ZOOM_FACTOR)
  };
  const nextHistory = [
    nextEntry,
    ...history.filter((entry) => entry.resolution !== formattedResolution)
  ];

  return nextHistory.slice(0, limit);
}
