import { Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function AuthBrand() {
  return (
    <Link
      href="/"
      title="HUNAR Home"
      className="group flex items-center gap-2 transition-opacity hover:opacity-90"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-navy shadow-sm">
        <Star className="size-4 fill-teal text-teal" />
      </span>
      <span className="flex flex-col text-left">
        <span className="text-base font-extrabold leading-none tracking-tight text-navy">
          HUNAR
        </span>
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-teal">
          Pakistan Verified
        </span>
      </span>
    </Link>
  );
}