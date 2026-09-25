import React from "react";

export interface WorkerFixLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

const SIZES = {
  sm: {
    icon: "size-8",
    svg: "size-4",
    text: "text-lg",
    badge: "text-[9px] px-1 py-0.5",
    gap: "gap-2",
  },
  md: {
    icon: "size-9.5",
    svg: "size-5",
    text: "text-xl",
    badge: "text-[10px] px-1.5 py-0.5",
    gap: "gap-2.5",
  },
  lg: {
    icon: "size-12",
    svg: "size-6",
    text: "text-2xl",
    badge: "text-xs px-2 py-0.5",
    gap: "gap-3",
  },
  xl: {
    icon: "size-16",
    svg: "size-8",
    text: "text-3xl",
    badge: "text-xs px-2.5 py-1",
    gap: "gap-3.5",
  },
};

export function WorkerFixLogo({
  variant = "dark",
  size = "md",
  showText = true,
  showBadge = false,
  className = "",
}: WorkerFixLogoProps) {
  const cfg = SIZES[size] || SIZES.md;
  const isLight = variant === "light";

  return (
    <div
      className={`inline-flex items-center ${cfg.gap} select-none ${className}`}
      aria-label="WorkerFIX"
    >
      {/* Brand Icon Emblem */}
      <div
        className={`${cfg.icon} rounded-xl bg-gradient-to-br from-[#123B5D] via-[#0E526C] to-[#0F8B8D] flex items-center justify-center shadow-xs border border-white/15 shrink-0 transition-transform group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${cfg.svg} text-white`}
        >
          {/* Stylized W + Tool Monogram */}
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight">
            <span
              className={`font-black ${cfg.text} ${
                isLight ? "text-white" : "text-[#123B5D]"
              } tracking-tight font-sans`}
            >
              Worker
            </span>
            <span
              className={`font-black ${cfg.text} text-[#0F8B8D] tracking-tight font-sans ms-0.5`}
            >
              FIX
            </span>
            <span className="size-1.5 rounded-full bg-[#0F8B8D] ms-0.5 mb-1.5 animate-pulse" />
          </div>

          {showBadge && (
            <span
              className={`font-bold uppercase tracking-wider text-[9px] ${
                isLight ? "text-teal-300" : "text-slate-500"
              } mt-0.5`}
            >
              Verified Pro Network
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Backward-compatible exports for all existing files
export const OrderworkerLogo = WorkerFixLogo;
export type OrderworkerLogoProps = WorkerFixLogoProps;

export const WorkerFixIcon = (props: WorkerFixLogoProps) => (
  <WorkerFixLogo {...props} showText={false} />
);

export const OrderworkerIcon = WorkerFixIcon;
