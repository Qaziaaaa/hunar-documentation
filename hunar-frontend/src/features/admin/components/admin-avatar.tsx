"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/avatar";

/**
 * Admin-table avatar: renders the profile photo when one exists, otherwise the
 * same initial-letter block the pages used before. URLs run through
 * resolveAvatarUrl so relative /uploads/... paths hit the backend origin.
 */
export function AdminAvatar({
  src,
  name,
  className,
  top,
}: {
  src?: string | null;
  name: string;
  className?: string;
  /** Amber gradient (TOP PRO rows) instead of the default navy box. */
  top?: boolean;
}) {
  const resolved = resolveAvatarUrl(src);
  const [failed, setFailed] = useState(false);
  const initials =
    (name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "A").toUpperCase();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden text-xs font-bold text-white shadow-sm",
        top
          ? "bg-gradient-to-br from-amber-400 to-amber-600"
          : "bg-navy",
        className,
      )}
    >
      {resolved && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin tables use plain <img>; remotePatterns only cover next/image
        <img
          src={resolved}
          alt={name || "User"}
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
