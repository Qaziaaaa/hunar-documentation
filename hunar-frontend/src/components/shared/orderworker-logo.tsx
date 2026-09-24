import React from "react";

interface OrderworkerLogoProps {
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

export function OrderworkerLogo({
  variant = "dark",
  size = "md",
  showText = true,
  showBadge = false,
  className = "",
}: OrderworkerLogoProps) {
  const { img } = SIZES[size] || SIZES.md;
  const src = "/complete-orderworder-logo.png";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Orderworker"
        className={`${img} w-auto object-contain`}
        loading="eager"
      />
    </div>
  );
}

export const OrderworkerIcon = (props: OrderworkerLogoProps) => (
  <OrderworkerLogo {...props} showText={false} />
);


