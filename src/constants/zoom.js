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
];

const ZOOM_FACTOR_PRECISION = 2;
const SUPPORTED_ZOOM_FACTOR_EPSILON = 0.001;

export function normalizeZoomFactor(zoomFactor) {
  const normalizedInput = Number(zoomFactor);

  if (!Number.isFinite(normalizedInput)) {
    return Number.NaN;
  }

  if (normalizedInput <= 0) {
    return Number.NaN;
  }

  const supportedZoomFactor = SUPPORTED_ZOOM_FACTORS.find((value) => {
    return Math.abs(value - normalizedInput) < SUPPORTED_ZOOM_FACTOR_EPSILON;
  });

  if (supportedZoomFactor !== undefined) {
    return supportedZoomFactor;
  }

  return Number(normalizedInput.toFixed(ZOOM_FACTOR_PRECISION));
}
