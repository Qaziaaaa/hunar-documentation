"use client";

import {
  AlertCircle,
  ArrowRight,
  FileX,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { WorkerVerificationData } from "../types";

export function RejectedView({ data }: { data: WorkerVerificationData }) {
  return (
    <div className="space-y-4 text-left">
      {/* Top Header */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/10 px-3 py-1 text-xs font-bold text-error mb-2">
          <XCircle className="size-3.5" />
          <span>Verification Unsuccessful</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy">
          Action Required: Profile Not Approved
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Our compliance team could not verify your identity documents. Please review the reason below and re-submit.
        </p>
      </div>

      {/* Rejection Reason Card (Red / Error Alert) */}
      <div className="rounded-2xl border-2 border-error/30 bg-error/5 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-error text-white">
            <FileX className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-navy uppercase tracking-wider">
              Reason for Rejection:
            </h3>
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
              {data.rejectionReason ||
                "Identity verification failed: The photo of your Smart CNIC front is blurry or the 13-digit identification number does not match your account details."}
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines to Fix & Get Verified */}
      <div className="rounded-2xl bg-white p-2 space-y-2.5">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-navy flex items-center gap-1.5">
          <HelpCircle className="size-3.5 text-teal" />
          How to get approved on re-submission:
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-teal font-bold">1.</span>
            <span>Take high-resolution, glare-free photos of your original <strong>Smart CNIC</strong> (both Front & Back).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal font-bold">2.</span>
            <span>Ensure all 4 corners of the identity card and your face portrait are clearly visible.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal font-bold">3.</span>
            <span>Verify that the full name on your profile matches the name on your NADRA CNIC.</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        <Link
          href="/worker/onboarding"
          className={buttonVariants({
            size: "lg",
            className:
              "h-12 w-full sm:flex-1 rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 flex items-center justify-center gap-2",
          })}
        >
          <RefreshCw className="size-4" />
          <span>Fix Details & Re-Submit</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Link>

        <a
          href="https://wa.me/923140837519"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className:
              "h-12 w-full sm:w-auto rounded-full border-2 border-navy text-xs sm:text-sm font-bold text-navy hover:bg-slate-50 flex items-center justify-center gap-2",
          })}
        >
          <MessageSquare className="size-4 text-success" />
          <span>WhatsApp Support (+92 314 0837519)</span>
        </a>
      </div>
    </div>
  );
}
