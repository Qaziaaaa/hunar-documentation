"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Phone, Send, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
  phoneFormSchema,
  type PhoneFormValues,
} from "../schemas/signup";

export function PhoneStep({
  onSubmit,
  submitting,
  submitError,
}: {
  onSubmit: (values: PhoneFormValues) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const t = useTranslations("Auth");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: "" },
    mode: "onTouched",
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col"
      noValidate
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
          <Wrench className="size-3.5" />
          {t("workerBadge")}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">
          {t("createTitle")}
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {t("alreadyAccount")}{" "}
          <Link
            href="/worker/sign-in"
            className="font-semibold text-teal hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>

        <div className="mx-auto mt-4 flex max-w-[280px] items-center rounded-full bg-slate-200 p-1 shadow-inner">
          <Link
            href="/worker/sign-in"
            className="flex-1 rounded-full py-1.5 text-center text-xs font-semibold text-navy transition"
          >
            {t("signIn")}
          </Link>
          <span className="flex-1 rounded-full bg-teal py-1.5 text-center text-xs font-bold text-white shadow-md">
            {t("register")}
          </span>
        </div>
      </div>

      <div className="mt-7 space-y-1.5">
        <label
          htmlFor="phone"
          className="ml-1 block text-xs font-semibold text-navy"
        >
          {t("phoneLabel")}
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            {...register("phone")}
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            aria-invalid={errors.phone ? true : undefined}
            className="pl-11"
          />
        </div>
        {errors.phone ? (
          <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
            <AlertCircle className="size-3.5 shrink-0" />
            {errors.phone.message}
          </p>
        ) : (
          <p className="ml-1 text-xs text-muted-foreground">{t("phoneHint")}</p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-orange/20 bg-orange/10 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#B45309]">
          <AlertCircle className="size-3.5" />
          {t("otpRulesTitle")}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[#92400E]">
          {t("otpRules")}
        </p>
      </div>

      {submitError ? (
        <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-xs font-medium text-error">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {submitError}
        </p>
      ) : null}

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-14 w-full rounded-full text-base font-semibold shadow-lg shadow-teal/25"
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <span>{t("getOtp")}</span>
              <Send className="size-5 rtl:rotate-180" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}