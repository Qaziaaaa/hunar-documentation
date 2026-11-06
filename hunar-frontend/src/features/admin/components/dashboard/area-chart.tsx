"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

interface AreaChartProps {
  points: number[];
  /** X-axis tick labels (same length as points). */
  labels?: string[];
  className?: string;
  /** Show grid + x-labels + crosshair (hero); sparks omit these. */
  detailed?: boolean;
}

const PAD = { t: 14, r: 18, b: 30, l: 50 } as const;

/** Sample `ks()`: nice axis ticks, roughly 4 steps under max. */
function niceTicks(max: number): number[] {
  if (!isFinite(max) || max <= 0) return [0, 25, 50, 75, 100];
  const target = Math.ceil(max * 1.06);
  const rawStep = target / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const top = Math.ceil(target / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v));
  return ticks.length >= 2 ? ticks : [0, target];
}

/** Sample `As()`: monotone cubic path through points [x,y] in pixel space. */
function smoothPath(pts: [number, number][]): string {
  const t = pts.length;
  if (t < 2) return "";
  const n: number[] = [];
  const r: number[] = [];
  const i: number[] = [];
  for (let a = 0; a < t - 1; a++) {
    n[a] = pts[a + 1][0] - pts[a][0];
    r[a] = pts[a + 1][1] - pts[a][1];
    i[a] = r[a] / n[a];
  }
  const m: number[] = [i[0]];
  for (let e = 1; e < t - 1; e++) m[e] = i[e - 1] * i[e] <= 0 ? 0 : (i[e - 1] + i[e]) / 2;
  m[t - 1] = i[t - 2];
  for (let e = 0; e < t - 1; e++) {
    if (i[e] === 0) {
      m[e] = m[e + 1] = 0;
      continue;
    }
    const tt = m[e] / i[e];
    const nn = m[e + 1] / i[e];
    const rr = tt * tt + nn * nn;
    if (rr > 9) {
      const o = 3 / Math.sqrt(rr);
      m[e] = o * tt * i[e];
      m[e + 1] = o * nn * i[e];
    }
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let e = 0; e < t - 1; e++) {
    const h = n[e] / 3;
    d += ` C${(pts[e][0] + h).toFixed(1)} ${(pts[e][1] + m[e] * h).toFixed(1)} ${(pts[e + 1][0] - h).toFixed(1)} ${(pts[e + 1][1] - m[e + 1] * h).toFixed(1)} ${pts[e + 1][0].toFixed(1)} ${pts[e + 1][1].toFixed(1)}`;
  }
  return d;
}

function formatTick(v: number): string {
  if (v === 0) return "0";
  if (v >= 1_000_000) return `Rs. ${+(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `Rs. ${+(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k`;
  return `Rs. ${Math.round(v)}`;
}

/**
 * Wharf `.chart`: pixel viewBox, grid+Y labels, monotone area, end dot,
 * crosshair + night tooltip, arrow-key scrubbing, 1.1s clip reveal.
 */
export function AreaChart({ points, labels, className = "", detailed = false }: AreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<SVGGElement>(null);
  const crossRef = useRef<SVGGElement>(null);
  // Pointer state lives in a ref (sample mutates DOM directly): tracking the
  // crosshair must never trigger a React re-render — that was the stutter.
  const activeRef = useRef<number | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const uid = useId();

  const hasData = points.length >= 2 && points.some((v) => v > 0);

  // Measure container (sample: viewBox = client size). Fallback 800×320 for jsdom.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const w = wrap.clientWidth || 800;
      const h = wrap.clientHeight || 320;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const ready = w > 0 && h > 0 && points.length >= 2;

  const geo = useMemo(() => {
    if (!ready) return null;
    const n = points.length;
    const maxY = Math.max(...points);
    const ticks = niceTicks(maxY);
    const top = ticks[ticks.length - 1];
    const innerW = w - PAD.l - PAD.r;
    const innerH = h - PAD.t - PAD.b;
    const px = (i: number) => PAD.l + (i / (n - 1)) * innerW;
    const py = (v: number) => PAD.t + (1 - v / (top || 1)) * innerH;
    const pts: [number, number][] = points.map((v, i) => [px(i), py(v)]);
    const line = smoothPath(pts);
    const area = `${line} L${px(n - 1).toFixed(1)} ${py(0).toFixed(1)} L${px(0).toFixed(1)} ${py(0).toFixed(1)} Z`;
    return { pts, line, area, ticks, top, px, py, n, innerW, innerH };
  }, [ready, points, w, h]);

  // Clip reveal (sample: rect width 0→full, 1.1s power3.inOut) via WAAPI scaleX.
  useEffect(() => {
    const el = clipRef.current;
    if (!el || !hasData || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim = el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: 1100,
      easing: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [hasData, points, w, h]);

  const nearestIndex = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || !geo) return null;
      const rect = svg.getBoundingClientRect();
      const rel = (clientX - rect.left) / Math.max(rect.width, 1);
      const t = Math.min(Math.max((rel * w - PAD.l) / geo.innerW, 0), 1);
      return Math.round(t * (geo.n - 1));
    },
    [geo, w],
  );

  const showTip = useCallback(
    (i: number) => {
      const tip = tipRef.current;
      const svg = svgRef.current;
      const wrap = wrapRef.current;
      const cross = crossRef.current;
      if (!tip || !svg || !wrap || !cross || !geo) return;
      const wasHidden = !tip.style.opacity || tip.style.opacity === "0";
      activeRef.current = i;
      const rect = svg.getBoundingClientRect();
      const wRect = wrap.getBoundingClientRect();
      const cx = geo.px(i);
      const cy = geo.py(points[i]);
      const px = (cx / w) * rect.width + (rect.left - wRect.left);
      const py = (cy / h) * rect.height + (rect.top - wRect.top);
      const val = points[i];
      tip.innerHTML = `<b>Rs. ${Math.round(val).toLocaleString()}</b><span>${labels?.[i] ?? ""}</span>`;
      tip.style.opacity = "1";
      // Sample placement: 26px right of the point (flip left on overflow),
      // vertically centred on the point and clamped to the chart box.
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const tx = px + 26 + tw > wRect.width ? px - 26 - tw : px + 26;
      const ty = Math.max(4, Math.min(Math.max(wRect.height - th - 4, 4), py - th / 2));
      if (wasHidden) {
        // First reveal after hide: land in place (sample H.set), then glide.
        tip.style.transition = "none";
        tip.style.transform = `translate(${tx}px, ${ty}px)`;
        void tip.offsetWidth;
        tip.style.transition = "";
      } else {
        tip.style.transform = `translate(${tx}px, ${ty}px)`;
      }
      // Crosshair: x glides via the group transform (CSS .25s power3.out),
      // the dot snaps its cy to the sampled point like the sample does.
      cross.style.transform = `translateX(${cx.toFixed(1)}px)`;
      cross.querySelectorAll("circle").forEach((c) => c.setAttribute("cy", cy.toFixed(1)));
      cross.style.opacity = "1";
    },
    [geo, points, labels, w, h],
  );

  const hideTip = useCallback(() => {
    activeRef.current = null;
    if (tipRef.current) tipRef.current.style.opacity = "0";
    if (crossRef.current) crossRef.current.style.opacity = "0";
  }, []);

  if (points.length < 2) {
    return (
      <div ref={wrapRef} className={`wf-chart ${className}`}>
        <div className="wf-empty">Not enough data to chart yet</div>
      </div>
    );
  }

  if (!geo) {
    return <div ref={wrapRef} className={`wf-chart ${className}`} />;
  }

  const { line, area, ticks, px, py, n, innerW } = geo;
  const lastI = n - 1;
  const lastX = px(lastI);
  const lastY = py(points[lastI]);

  // X labels: sample spaces ticks so labels never collide (~76px min).
  const tickEvery = Math.max(Math.ceil(n / Math.max(2, Math.floor(innerW / 76))), 1);
  const xTicks: { lab: string; i: number }[] = [];
  for (let i = n - 1; i >= 0; i -= tickEvery) xTicks.unshift({ lab: labels?.[i] ?? String(i + 1), i });
  if (xTicks[0]?.i !== 0) xTicks.unshift({ lab: labels?.[0] ?? "1", i: 0 });

  return (
    <div ref={wrapRef} className={`wf-chart ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        className="wf-chart__svg"
        role="img"
        tabIndex={0}
        aria-label={`Area chart, ${n} points, latest Rs. ${Math.round(points[lastI]).toLocaleString()}. Use arrow keys to scrub values.`}
        onPointerMove={(e) => {
          const i = nearestIndex(e.clientX);
          if (i !== null) showTip(i);
        }}
        onPointerLeave={hideTip}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const cur = activeRef.current ?? lastI;
          const next = Math.min(Math.max(cur + (e.key === "ArrowRight" ? 1 : -1), 0), lastI);
          showTip(next);
        }}
        onBlur={hideTip}
      >
        <defs>
          <clipPath id={`${uid}-clip`}>
            <rect x={PAD.l} y="0" width={Math.max(w - PAD.l - PAD.r, 0)} height={h} />
          </clipPath>
        </defs>

        {detailed && (
          <g className="wf-chart__grid" aria-hidden>
            {ticks.map((tv) => {
              const yy = py(tv);
              return (
                <g key={tv}>
                  <line x1={PAD.l} y1={yy} x2={w - PAD.r} y2={yy} />
                  <text x={PAD.l - 10} y={yy + 4} textAnchor="end">
                    {formatTick(tv)}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        <g ref={clipRef} clipPath={`url(#${uid}-clip)`} style={{ transformOrigin: `${PAD.l}px 50%` }}>
          <path d={area} className="wf-chart__area" />
          <path d={line} className="wf-chart__line" />
        </g>

        <circle cx={lastX} cy={lastY} r="7" className="wf-chart__ring" />
        <circle cx={lastX} cy={lastY} r="4.5" className="wf-chart__dot" />

        {detailed && (
          <g className="wf-chart__xl" aria-hidden>
            {xTicks.map(({ lab, i }) => (
              <text
                key={i}
                x={px(i)}
                y={h - 8}
                textAnchor={i === 0 ? "start" : i === lastI ? "end" : "middle"}
              >
                {lab}
              </text>
            ))}
          </g>
        )}

        {detailed && (
          <g
            id={`${uid}-cross`}
            ref={crossRef}
            className="wf-chart__cross"
            style={{ opacity: 0 }}
            aria-hidden
          >
            <line x1="0" y1={PAD.t} x2="0" y2={h - PAD.b} />
            <circle cx="0" cy="0" r="7" className="wf-chart__ring" />
            <circle cx="0" cy="0" r="4.5" className="wf-chart__dot" />
          </g>
        )}
      </svg>
      {detailed && <div ref={tipRef} className="wf-chart__tip" aria-hidden />}
    </div>
  );
}
