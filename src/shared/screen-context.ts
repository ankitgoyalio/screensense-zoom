type ScreenDimensions = {
  height: number;
  width: number;
};

export type NormalizedScreenContext = {
  height: number;
  resolutionKey: string;
  width: number;
};

export function createNormalizedScreenContext({
  width,
  height
}: ScreenDimensions): NormalizedScreenContext {
  const normalizedWidth = Math.max(width, height);
  const normalizedHeight = Math.min(width, height);

  return {
    height: normalizedHeight,
    resolutionKey: `${normalizedWidth} x ${normalizedHeight}`,
    width: normalizedWidth
  };
}
