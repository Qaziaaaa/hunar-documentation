"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  MessageCircle,
  Pencil,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { OTP_RULES } from "../api/auth-api";
import { OtpInput } from "./otp-input";
import { formatCountdown, useCountdown } from "../hooks/use-countdown";
import { otpFormSchema, type OtpFormValues } from "../schemas/signup";

export function OtpStep({
  phone,
  expiresAt,
  resendAt,
  attemptsLeft,
  submitting,
  submitError,
  onEdit,
  onResend,
  onSubmit,
}: {
  phone: string;
  expiresAt: number | null;
  resendAt: number | null;
  attemptsLeft: number | null;
  submitting: boolean;
  submitError: string | null;
  onEdit: () => void;
  onResend: (channel: "sms" | "whatsapp") => void;
  onSubmit: (values: OtpFormValues) => void;
}) {
  const t = useTranslations("Auth");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: "" },
  });

  const code = useWatch({ control, name: "code" }) ?? "";
  const resendRemaining = useCountdown(resendAt);
  const expiresRemaining = useCountdown(expiresAt);
  const expired = expiresAt !== null && expiresRemaining === 0;
  const showAttempts =
    attemptsLeft !== null && attemptsLeft < OTP_RULES.maxAttempts;

  return (
    <div className="flex flex-1 flex-col">
      <section className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          {t("verifyTitle")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t("verifySubtitle")}
        </p>
        <div className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold text-navy">
          <span dir="ltr">{phone}</span>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-0.5 text-xs font-semibold text-teal underline underline-offset-2"
          >
            {t("edit")}
            <Pencil className="size-3" />
          </button>
        </div>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-7 flex flex-1 flex-col"
        noValidate
      >
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <OtpInput
              value={field.value}
              onChange={field.onChange}
              disabled={submitting}
              invalid={Boolean(errors.code) || Boolean(submitError)}
            />
          )}
        />

        {errors.code ? (
          <p className="mt-3 text-center text-xs font-medium text-error">
            {errors.code.message}
          </p>
        ) : null}

        {showAttempts ? (
          <p className="mt-3 text-center text-xs font-medium text-error">
            {t("attemptsMessage", { count: attemptsLeft ?? 0 })}
          </p>
        ) : null}

        {submitError ? (
          <p className="mt-3 flex items-start justify-center gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-center text-xs font-medium text-error">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {submitError}
          </p>
        ) : null}

        <div className="mt-6 space-y-3 text-center">
          {resendRemaining > 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-[#B45309]">
              <Timer className="size-3.5 animate-pulse text-orange" />
              {t("resendIn")}{" "}
              <strong className="font-semibold text-orange">
                {formatCountdown(resendRemaining)}
              </strong>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => onResend("sms")}
                disabled={submitting}
                className="font-semibold text-teal hover:underline disabled:opacity-50"
              >
                {t("resendSms")}
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => onResend("whatsapp")}
                disabled={submitting}
                className="inline-flex items-center gap-1 font-semibold text-teal hover:underline disabled:opacity-50"
              >
                <MessageCircle className="size-3.5" />
                {t("resendWhatsapp")}
              </button>
            </div>
          )}

          {expired ? (
            <p className="text-[11px] font-medium text-error">
              {t("codeExpired")}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {t("codeExpiresIn")}{" "}
              <span dir="ltr" className="font-semibold text-navy">
                {formatCountdown(expiresRemaining)}
              </span>
            </p>
          )}
        </div>

        <div className="mt-auto pt-8">
          <Button
            type="submit"
            size="lg"
            disabled={submitting || code.length !== 6 || expired}
            className="h-14 w-full rounded-full text-base font-semibold shadow-lg shadow-teal/25"
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <span>{t("verifyAndProceed")}</span>
                <ArrowRight className="size-5 rtl:rotate-180" />
              </>
            )}
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-success" />
            {t("secureVerification")}
          </div>
        </div>
      </form>
    </div>
  );
}