/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useCountUp } from "./use-count-up";

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe("useCountUp", () => {
  it("shows the target immediately in the test environment and follows target changes", () => {
    process.env.NODE_ENV = "test";
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target),
      { initialProps: { target: 42 } },
    );
    expect(result.current).toBe(42);

    rerender({ target: 77 });
    expect(result.current).toBe(77);
  });

  it("counts from 0 to the target once, then tweens from the current value on refresh", () => {
    process.env.NODE_ENV = "development";
    jest.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, 500),
      { initialProps: { target: 100 } },
    );

    // First run starts at 0 (entrance), advances through intermediate values.
    expect(result.current).toBe(0);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const mid = result.current;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);

    // The live poll changes the target: tween must NOT restart from 0.
    rerender({ target: 200 });
    expect(result.current).toBeGreaterThanOrEqual(mid);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(200);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(200);

    jest.useRealTimers();
  });
});
