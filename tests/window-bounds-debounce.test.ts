import { describe, expect, mock, test } from "bun:test";

import { createWindowBoundsDebouncer } from "../src/shared/window-bounds-debounce";

describe("window bounds debounce", () => {
  test("replaces an existing timeout for the same window before scheduling a new one", () => {
    const clearTimeoutFn = mock(() => {});
    const setTimeoutFn = mock((_callback: () => void, _delay: number) => 42);
    const run = mock(() => {});
    const debouncer = createWindowBoundsDebouncer({
      clearTimeoutFn,
      run,
      setTimeoutFn
    });

    debouncer.schedule(7);
    debouncer.schedule(7);

    expect(clearTimeoutFn).toHaveBeenCalledTimes(1);
    expect(setTimeoutFn).toHaveBeenCalledTimes(2);
    expect(run).not.toHaveBeenCalled();
  });

  test("maintains independent timeouts for different windows and preserves the configured delay", () => {
    const clearTimeoutFn = mock(() => {});
    const setTimeoutFn = mock((_callback: () => void, delay: number) => {
      expect(delay).toBe(250);
      return 42;
    });
    const run = mock(() => {});
    const debouncer = createWindowBoundsDebouncer({
      clearTimeoutFn,
      delayMs: 250,
      run,
      setTimeoutFn
    });

    debouncer.schedule(1);
    debouncer.schedule(2);

    expect(clearTimeoutFn).not.toHaveBeenCalled();
    expect(setTimeoutFn).toHaveBeenCalledTimes(2);
    expect(run).not.toHaveBeenCalled();
  });

  test("runs the callback with the scheduled window id when the timeout fires", () => {
    let scheduledCallback: (() => void) | undefined;
    const run = mock(() => {});
    const debouncer = createWindowBoundsDebouncer({
      run,
      setTimeoutFn(callback) {
        scheduledCallback = callback;
        return 42;
      }
    });

    debouncer.schedule(11);
    scheduledCallback?.();

    expect(run).toHaveBeenCalledWith(11);
  });

  test("cancels all pending timeouts", () => {
    const clearTimeoutFn = mock(() => {});
    const setTimeoutFn = mock((_callback: () => void, _delay: number) => Math.random());
    const run = mock(() => {});
    const debouncer = createWindowBoundsDebouncer({
      clearTimeoutFn,
      run,
      setTimeoutFn
    });

    debouncer.schedule(1);
    debouncer.schedule(2);
    debouncer.cancelAll();

    expect(clearTimeoutFn).toHaveBeenCalledTimes(2);
    expect(run).not.toHaveBeenCalled();
  });
});
