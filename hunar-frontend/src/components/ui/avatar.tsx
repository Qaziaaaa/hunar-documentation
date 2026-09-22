"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-9 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-teal/10 text-teal",
        className
      )}
      {...props}
    />
  );
}

function AvatarFallbackIcon({
  className,
  ...props
}: Omit<React.ComponentProps<typeof AvatarPrimitive.Fallback>, "children">) {
  return (
    <AvatarFallback className={className} {...props}>
      <User aria-hidden="true" className="size-4" />
    </AvatarFallback>
  );
}

export { Avatar, AvatarFallback, AvatarFallbackIcon, AvatarImage };