import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (
    checked: boolean,
    eventDetails: SwitchPrimitive.Root.ChangeEventDetails,
  ) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
  "aria-label"?: string;
}

function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  name,
  className,
  ...rest
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      name={name}
      data-slot="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-teal data-[unchecked]:bg-input",
        className
      )}
      {...rest}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 data-[checked]:translate-x-4 data-[unchecked]:translate-x-0.5 rtl:data-[checked]:-translate-x-4 rtl:data-[unchecked]:-translate-x-0.5" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };