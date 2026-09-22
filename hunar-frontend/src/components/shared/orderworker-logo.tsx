import React from "react";

interface OrderworkerLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

const SIZES = {
  sm: { img: "h-7" },
  md: { img: "h-9" },
  lg: { img: "h-11" },
  xl: { img: "h-14" },
};

export function OrderworkerLogo({
  variant = "dark",
  size = "md",
  showText = true,
  showBadge = false,
  className = "",
}: OrderworkerLogoProps) {
  const isLight = variant === "light";
  const { img } = SIZES[size] || SIZES.md;
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
    </div>
  );
}

export const OrderworkerIcon = (props: OrderworkerLogoProps) => (
  <OrderworkerLogo {...props} showText={false} />
);

