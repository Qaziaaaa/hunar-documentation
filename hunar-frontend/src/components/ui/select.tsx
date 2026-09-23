"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string | null, event: unknown) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

function Select({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder,
  disabled,
  name,
  id,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const items = Object.fromEntries(
    options
      .filter((o) => !o.disabled)
      .map((o) => [o.value, o.label] as [string, string]),
  );

  return (
    <SelectPrimitive.Root
      name={name}
      value={value ?? undefined}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      items={items}
      disabled={disabled}
      data-slot="select"
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "group/select inline-flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[open]/select:rotate-180"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4} className="z-50">
          <SelectPrimitive.Popup className="min-w-(--anchor-width) overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <SelectPrimitive.List className="max-h-64 overflow-y-auto" />
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
