export const SUPPORTED_ZOOM_FACTORS = [
  0.25,
  1 / 3,
  0.5,
  2 / 3,
  0.75,
  0.8,
  0.9,
  1,
  1.1,
  1.25,
  1.5,
  1.75,
  2,
  2.5,
  3,
  4,
  5
] as const;

export const DEFAULT_ZOOM_FACTOR = 1;

const ZOOM_FACTOR_PRECISION = 2;
const SUPPORTED_ZOOM_FACTOR_EPSILON = 0.001;

export function normalizeZoomFactor(zoomFactor: number): number {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
    return DEFAULT_ZOOM_FACTOR;
  }

  const supportedZoomFactor = SUPPORTED_ZOOM_FACTORS.find((value) => {
    return Math.abs(value - zoomFactor) < SUPPORTED_ZOOM_FACTOR_EPSILON;
  });

  if (supportedZoomFactor !== undefined) {
    return supportedZoomFactor;
  }

  return Number(zoomFactor.toFixed(ZOOM_FACTOR_PRECISION));
}
