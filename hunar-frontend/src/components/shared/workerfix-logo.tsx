import React from "react";

export interface WorkerFixLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

const FULL_SIZES = {
  sm: "h-7 sm:h-8",
  md: "h-8 sm:h-10",
  lg: "h-10 sm:h-12",
  xl: "h-14 sm:h-16",
};

const ICON_SIZES = {
  sm: "h-7 w-auto",
  md: "h-9 w-auto",
  lg: "h-11 w-auto",
  xl: "h-14 w-auto",
};

export function WorkerFixLogo({
  variant = "dark",
  size = "md",
  showText = true,
  className = "",
}: WorkerFixLogoProps) {
  const isLight = variant === "light";

  if (!showText) {
    const iconSizeClass = ICON_SIZES[size] || ICON_SIZES.md;
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/workerfix-icon.png"
          alt="WorkerFIX"
          className={`${iconSizeClass} object-contain transition-transform group-hover:scale-105`}
          loading="eager"
        />
      </div>
    );
  }

  const fullSizeClass = FULL_SIZES[size] || FULL_SIZES.md;
  const src = isLight ? "/workerfix-logo-white.png" : "/workerfix-logo-dark.png";

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="WorkerFIX"
        className={`${fullSizeClass} w-auto object-contain transition-transform group-hover:scale-[1.02]`}
        loading="eager"
      />
    </div>
  );
}

export const WorkerFixIcon = (props: WorkerFixLogoProps) => (
  <WorkerFixLogo {...props} showText={false} />
);

// Backward-compatible exports
export const OrderworkerLogo = WorkerFixLogo;
export const OrderworkerIcon = WorkerFixIcon;
