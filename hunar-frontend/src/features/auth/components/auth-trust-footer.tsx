"use client";

import { Lock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-navy">
      <Icon className="size-4 text-teal" />
      <span className="text-[11px] font-semibold tracking-tight">{label}</span>
    </div>
  );
}

export function AuthTrustFooter() {
  const t = useTranslations("Auth");

  return (
    <footer className="px-6 pb-8 pt-6" data-purpose="trust-guarantee-footer">
      <div className="border-t border-slate-200/80 pt-4">
        <div className="flex items-center justify-center gap-4">
          <TrustItem icon={ShieldCheck} label={t("trustCnic")} />
          <span className="size-1 rounded-full bg-slate-300" />
          <TrustItem icon={Lock} label={t("trustSecure")} />
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {t("copyright")}
        </p>
      </div>
    </footer>
  );
}