import React from "react";

export interface WorkerFixLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

const SIZES = {
  sm: { img: "h-9" },
  md: { img: "h-11" },
  lg: { img: "h-14" },
  xl: { img: "h-20" },
};

export function WorkerFixLogo({
  size = "md",
  className = "",
}: WorkerFixLogoProps) {
  const cfg = SIZES[size] || SIZES.md;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/complete-orderworder-logo.png"
        alt="Orderworker"
        className={`${cfg.img} w-auto object-contain`}
        loading="eager"
      />
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
