import { Check, Clock, Home, LayoutDashboard } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export function OnboardingSuccess() {
  return (
    <div className="space-y-5 py-4 text-center">
      {/* Big Green Animated Checkmark Badge */}
      <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-success/30 bg-success/10 text-success shadow-lg shadow-success/10">
        <div className="flex size-14 items-center justify-center rounded-full bg-success text-white shadow-md">
          <Check className="size-8 stroke-[3]" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Profile Submitted! 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Thank you for joining HUNAR. Your verified photo, trade credentials, and Smart CNIC documents have been submitted successfully.
        </p>
      </div>

      {/* Under Review Callout Box */}
      <div className="mx-auto max-w-sm rounded-2xl border-[1.5px] border-orange bg-white p-4 text-left shadow-xs shadow-orange/10 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-navy sm:text-sm">
            <Clock className="size-4 text-orange" />
            <span>Under Review</span>
          </div>
          <span className="rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[10px] font-bold text-orange">
            Pending Admin Check
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Our compliance team is verifying your Smart CNIC, photo match, and trade certificate with NADRA records. We will notify you via SMS when you are approved to receive customer visits.
        </p>
      </div>

      {/* Actions */}
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2.5 pt-2">
        <Link
          href="/worker/verification-status"
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 w-full rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 flex items-center justify-center gap-2",
          })}
        >
          <Clock className="size-4" />
          <span>Track Verification Status</span>
        </Link>
        <Link
          href="/worker/dashboard"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className:
              "h-12 w-full rounded-full border-2 border-navy text-sm font-bold text-navy hover:bg-slate-50 flex items-center justify-center gap-2",
          })}
        >
          <LayoutDashboard className="size-4" />
          <span>Go to Worker Portal</span>
        </Link>
      </div>
    </div>
  );
}
