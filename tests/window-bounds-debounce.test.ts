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
});
