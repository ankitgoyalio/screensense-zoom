export const SUPPORTED_ZOOM_FACTORS = [
  0.25,
  0.33,
  0.5,
  0.67,
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
];

const ZOOM_FACTOR_PRECISION = 2;

export function normalizeZoomFactor(zoomFactor) {
  return Number(zoomFactor.toFixed(ZOOM_FACTOR_PRECISION));
}
