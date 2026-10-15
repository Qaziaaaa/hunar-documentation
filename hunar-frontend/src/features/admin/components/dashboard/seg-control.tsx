"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Wharf-style segmented control: a sliding night pill (transform-only, 0.45s
 * power3.inOut) behind the buttons. Measures with ResizeObserver; no deps.
 */
export function SegControl<T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
  label,
  className = "",
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "md" | "sm";
  label: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const btnRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const animatedRef = useRef(false);

  const placePill = useCallback(
    (animate: boolean) => {
      const container = containerRef.current;
      const pill = pillRef.current;
      if (!container || !pill) return;
      const btn = btnRefs.current.get(value);
      if (!btn) return;

      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      // Pill base width is 100px at left:3px — map with translateX + scaleX.
      const baseLeft = 3;
      const x = bRect.left - cRect.left + container.scrollLeft - baseLeft;
      const scaleX = bRect.width / 100;

      pill.classList.toggle("wf-seg__pill--anim", animate);
      pill.style.transform = `translateX(${x}px) scaleX(${scaleX})`;
    },
    [value],
  );

  useLayoutEffect(() => {
    // First paint: snap without transition.
    placePill(animatedRef.current);
    animatedRef.current = true;
  }, [placePill]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => placePill(false));
    ro.observe(container);
    return () => ro.disconnect();
  }, [placePill]);

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className={`wf-seg ${size === "sm" ? "wf-seg--small" : ""} ${className}`}
    >
      <span ref={pillRef} className="wf-seg__pill" aria-hidden />
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          ref={(el) => {
            if (el) btnRefs.current.set(opt.value, el);
            else btnRefs.current.delete(opt.value);
          }}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="wf-seg__btn"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
