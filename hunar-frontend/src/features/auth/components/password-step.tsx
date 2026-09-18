"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  passwordFormSchema,
  type PasswordFormValues,
} from "../schemas/signup";

export function PasswordStep({
  onSubmit,
  submitting,
  submitError,
}: {
  onSubmit: (values: PasswordFormValues) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const t = useTranslations("Auth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const rules = [
    { label: t("ruleLength"), met: password.length >= 8 },
    { label: t("ruleLetter"), met: /[a-zA-Z]/.test(password) },
    { label: t("ruleNumber"), met: /\d/.test(password) },
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col"
      noValidate
    >
      <section className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          {t("passwordTitle")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t("passwordSubtitle")}
        </p>
      </section>

      <div className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="ml-1 block text-xs font-semibold text-navy"
          >
            {t("passwordLabel")}
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              aria-invalid={errors.password ? true : undefined}
              className="pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
              <AlertCircle className="size-3.5 shrink-0" />
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="ml-1 block text-xs font-semibold text-navy"
          >
            {t("confirmPasswordLabel")}
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...register("confirmPassword")}
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("confirmPasswordPlaceholder")}
              aria-invalid={errors.confirmPassword ? true : undefined}
              className="pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              {showConfirm ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
              <AlertCircle className="size-3.5 shrink-0" />
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        <ul className="space-y-1.5 rounded-2xl bg-slate-50 p-3">
          {rules.map((rule) => (
            <li
              key={rule.label}
              className={`flex items-center gap-1.5 text-xs font-medium ${
                rule.met ? "text-success" : "text-muted-foreground"
              }`}
            >
              <Check
                className={`size-3.5 ${
                  rule.met ? "text-success" : "text-slate-300"
                }`}
              />
              {rule.label}
            </li>
          ))}
        </ul>

        {submitError ? (
          <p className="flex items-start gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-xs font-medium text-error">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {submitError}
          </p>
        ) : null}
      </div>

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
              <ShieldCheck className="size-5" />
              <span>{t("createAccount")}</span>
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {t("roleNote")}
        </p>
      </div>
    </form>
  );
}