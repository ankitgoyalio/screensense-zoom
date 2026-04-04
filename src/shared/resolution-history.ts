export const RESOLUTION_HISTORY_LIMIT = 10;
export const RESOLUTION_STORAGE_KEY = "windowResolutionHistory";

type ResolutionLike = {
  height?: number;
  width?: number;
};

export function formatResolution({ width, height }: ResolutionLike): string {
  return `${width ?? 0} x ${height ?? 0}`;
}

export function hasResolutionBounds(windowState: ResolutionLike): windowState is Required<ResolutionLike> {
  return Number.isFinite(windowState.width) && Number.isFinite(windowState.height);
}

export function recordResolution(
  history: string[],
  resolution: ResolutionLike,
  limit = RESOLUTION_HISTORY_LIMIT
): string[] {
  const formattedResolution = formatResolution(resolution);
  const nextHistory = [formattedResolution, ...history.filter((entry) => entry !== formattedResolution)];

  return nextHistory.slice(0, limit);
}
