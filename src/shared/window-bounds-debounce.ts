const WINDOW_BOUNDS_DEBOUNCE_MS = 150;

type WindowBoundsDebouncerOptions = {
  clearTimeoutFn?: (timeoutId: ReturnType<typeof setTimeout>) => void;
  delayMs?: number;
  run: (windowId: number) => void;
  setTimeoutFn?: (
    callback: () => void,
    delay: number
  ) => ReturnType<typeof setTimeout>;
};

export function createWindowBoundsDebouncer({
  clearTimeoutFn = clearTimeout,
  delayMs = WINDOW_BOUNDS_DEBOUNCE_MS,
  run,
  setTimeoutFn = setTimeout
}: WindowBoundsDebouncerOptions) {
  const pendingTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  return {
    schedule(windowId: number): void {
      const existingTimeout = pendingTimeouts.get(windowId);

      if (existingTimeout !== undefined) {
        clearTimeoutFn(existingTimeout);
      }

      const timeoutId = setTimeoutFn(() => {
        pendingTimeouts.delete(windowId);
        run(windowId);
      }, delayMs);

      pendingTimeouts.set(windowId, timeoutId);
    }
  };
}
