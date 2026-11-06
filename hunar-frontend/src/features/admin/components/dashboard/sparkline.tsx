"use client";

import { useEffect, useRef } from "react";

interface SparklineProps {
  points: number[];
  className?: string;
}

/** Monotone cubic path (sample's `As`): smooth curve through points. */
function smoothPath(pts: [number, number][]): string {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1]![0] - pts[i]![0];
    dy[i] = pts[i + 1]![1] - pts[i]![1];
    m[i] = dy[i]! / dx[i]!;
  }
  const slopes: number[] = [m[0]!];
  for (let i = 1; i < n - 1; i++) {
    slopes[i] = m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2;
  }
  slopes[n - 1] = m[n - 2]!;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      slopes[i] = 0;
      slopes[i + 1] = 0;
      continue;
    }
    const a = slopes[i]! / m[i]!;
    const b = slopes[i + 1]! / m[i]!;
    const r = a * a + b * b;
    if (r > 9) {
      const t = 3 / Math.sqrt(r);
      slopes[i] = t * a * m[i]!;
      slopes[i + 1] = t * b * m[i]!;
    }
  }
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const t = dx[i]! / 3;
    d += ` C${(pts[i]![0] + t).toFixed(1)} ${(pts[i]![1] + slopes[i]! * t).toFixed(1)} ${(
      pts[i + 1]![0] - t
    ).toFixed(1)} ${(pts[i + 1]![1] - slopes[i + 1]! * t).toFixed(1)} ${pts[i + 1]![0].toFixed(
      1,
    )} ${pts[i + 1]![1].toFixed(1)}`;
  }
  return d;
}

let uid = 0;

/** Wharf `.spark`: viewBox 0 0 100 32, pad y 3–29, monotone curve, 1.1s clip reveal. */
export function Sparkline({ points, className = "" }: SparklineProps) {
  const gRef = useRef<SVGGElement>(null);
  const clipId = useRef(`sp${++uid}`);

  useEffect(() => {
    const el = gRef.current;
    if (!el || points.length < 2 || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim = el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: 1100,
      easing: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [points]);

  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points) - min || 1;
  const n = points.length;
  const coords = points.map((v, i): [number, number] => [
    (i / (n - 1)) * 100,
    3 + (1 - (v - min) / max) * 26,
  ]);
  const line = smoothPath(coords);
  const area = `${line} L100 32 L0 32 Z`;

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={`wf-spark ${className}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId.current}>
          <rect x="0" y="0" width="100" height="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId.current})`}>
        <g ref={gRef} style={{ transformOrigin: "0 50%" }}>
          <path d={area} className="wf-spark__area" />
          <path
            d={line}
            className="wf-spark__line"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </g>
    </svg>
  );
}
