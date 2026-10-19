"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tiny count-up (no deps): eases 0 → target over `duration` ms with
 * requestAnimationFrame, sample parity — first run counts from 0 (view
 * entrance), later target changes (live polls) tween from the currently
 * displayed value so numbers never snap back to zero mid-refresh.
 * Skips animation (shows final value immediately) under
 * prefers-reduced-motion and in the test environment.
 */
export function useCountUp(target: number, duration = 1300): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const displayedRef = useRef(0);
  const mountedRef = useRef(false);
  const isTest = process.env.NODE_ENV === "test";

  useEffect(() => {
    // Test environment: never animate and never setState — the hook derives
    // the target at render instead (existing dashboard tests assert sync).
    if (isTest) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      displayedRef.current = target;
      // rAF deferral: settles before paint, but the setState lives in a
      // callback rather than the effect body (react-hooks/set-state-in-effect).
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const from = mountedRef.current ? displayedRef.current : 0;
    mountedRef.current = true;
    if (from === target) {
      displayedRef.current = target;
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      displayedRef.current = next;
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, isTest]);

  return isTest ? target : value;
}
