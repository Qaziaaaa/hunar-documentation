import React from "react";

interface OrderworkerLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

const SIZES = {
  sm: { img: "h-7", badge: "text-[9px] px-1 py-0.2" },
  md: { img: "h-9", badge: "text-[10px] px-1.5 py-0.5" },
  lg: { img: "h-11", badge: "text-xs px-2 py-0.5" },
  xl: { img: "h-14", badge: "text-xs px-2 py-0.5" },
};

export function OrderworkerLogo({
  variant = "dark",
  size = "md",
  showText = true,
  showBadge = false,
  className = "",
}: OrderworkerLogoProps) {
  const isLight = variant === "light";
  const { img, badge } = SIZES[size] || SIZES.md;
  const src = showText
    ? isLight
      ? "/orderworker-logo-white.png"
      : "/orderworker-logo.png"
    : "/orderworker-icon.png";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Order Worker"
        className={`${img} w-auto object-contain`}
        loading="eager"
      />
      {showBadge && (
        <span
          className={`font-bold rounded uppercase tracking-wider ${badge} ${
            isLight
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              : "bg-teal-50 text-teal-700 border border-teal-200"
          }`}
        >
          PK
        </span>
      )}
    </div>
  );
}

export const OrderworkerIcon = (props: OrderworkerLogoProps) => (
  <OrderworkerLogo {...props} showText={false} />
);
