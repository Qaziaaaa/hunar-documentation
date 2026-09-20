"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { setTokens } from "@/lib/api-client";
import { customerLogin } from "../api/auth-api";
import { getErrorMessage } from "../lib/error";
import { normalizePkPhone } from "../lib/phone";
import { phoneSchema } from "../schemas/signup";

const signInSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Enter your password"),
});

type SignInValues = z.infer<typeof signInSchema>;

export function CustomerSignInForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phone: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: SignInValues) => {
    const normalized = normalizePkPhone(values.phone);
    if (!normalized) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await customerLogin(normalized, values.password);
      setTokens(response.accessToken, response.refreshToken, response.user);
      router.push("/customer/dashboard");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col"
      noValidate
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
          <Home className="size-3.5" />
          Customer Portal
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">
          Sign In as Customer
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Manage your job posts, quotes, and home repairs
        </p>

        <div className="mx-auto mt-4 flex max-w-[280px] items-center rounded-full bg-slate-200 p-1 shadow-inner">
          <span className="flex-1 rounded-full bg-teal py-1.5 text-center text-xs font-bold text-white shadow-md">
            {t("signIn")}
          </span>
          <Link
            href="/customer/sign-up"
            className="flex-1 rounded-full py-1.5 text-center text-xs font-semibold text-navy transition"
          >
            {t("register")}
          </Link>
        </div>
      </div>

      <div className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="cust-signin-phone"
            className="ml-1 block text-xs font-semibold text-navy"
          >
            {t("phoneLabel")}
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...register("phone")}
              id="cust-signin-phone"
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
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="cust-signin-password"
            className="ml-1 block text-xs font-semibold text-navy"
          >
            {t("passwordLabel")}
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...register("password")}
              id="cust-signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("signInPasswordPlaceholder")}
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

        {submitError ? (
          <p className="flex items-start gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-xs font-medium text-error">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {submitError}
          </p>
        ) : null}

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-teal shrink-0" />
          <span>{t("sessionNote")}</span>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-14 w-full rounded-full text-base font-semibold shadow-lg shadow-teal/25 bg-teal hover:bg-teal/90 text-white"
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <span>{t("signInButton")}</span>
              <ArrowRight className="size-5 rtl:rotate-180" />
            </>
          )}
        </Button>
        <div className="mt-3 flex flex-col items-center gap-1.5 text-center text-sm text-muted-foreground">
          <p>
            {t("noAccount")}{" "}
            <Link
              href="/customer/sign-up"
              className="font-semibold text-teal hover:underline"
            >
              {t("createOne")}
            </Link>
          </p>
          <p className="text-xs">
            Are you a skilled technician?{" "}
            <Link
              href="/worker/sign-in"
              className="font-medium text-navy hover:underline"
            >
              Worker Sign In →
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
