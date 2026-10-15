"use client";

import { ArrowLeft, HelpCircle } from "lucide-react";
import { AuthBrand } from "./auth-brand";
import { useRouter } from "@/i18n/navigation";

export function AuthTopBar({ helpHref = "mailto:support@workerfix.pk" }: { helpHref?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <header
      data-purpose="auth-header"
      className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-slate-100 bg-white/95 px-4 sm:px-6 pb-3 pt-4 backdrop-blur"
    >
      <button
        type="button"
        aria-label="Go back"
        onClick={goBack}
        className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
      >
        <ArrowLeft className="size-4 sm:size-5 rtl:rotate-180" />
      </button>

      <div className="flex items-center justify-center px-2">
        <AuthBrand />
      </div>

      <a
        aria-label="Support and FAQs"
        href={helpHref}
        className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95"
      >
        <HelpCircle className="size-4 sm:size-5" />
      </a>
    </header>
  );
}