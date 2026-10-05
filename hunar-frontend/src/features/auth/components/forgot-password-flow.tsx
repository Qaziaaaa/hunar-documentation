"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import {
  OTP_RULES,
  requestCustomerOtp,
  requestWorkerOtp,
  resendCustomerOtp,
  resendWorkerOtp,
  verifyCustomerOtp,
  verifyWorkerOtp,
  type OtpRequestResponse,
} from "../api/auth-api";
import { getApiErrorPayload, getErrorMessage } from "../lib/error";
import { formatPkPhone, normalizePkPhone } from "../lib/phone";
import { phoneSchema } from "../schemas/signup";
import { OtpStep } from "./otp-step";

const phoneStepSchema = z.object({
  phone: phoneSchema,
});
type PhoneStepValues = z.infer<typeof phoneStepSchema>;

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

type Step = "phone" | "otp" | "password" | "success";

export function ForgotPasswordFlow({
  role = "customer",
}: {
  role?: "customer" | "worker";
}) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const isCustomer = role === "customer";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Phone Step Form
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmitForm,
    formState: { errors: phoneErrors },
  } = useForm<PhoneStepValues>({
    resolver: zodResolver(phoneStepSchema),
    defaultValues: { phone: "" },
    mode: "onTouched",
  });

  // Password Step Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmitForm,
    control: passwordControl,
    formState: { errors: passwordErrors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const passwordVal = useWatch({ control: passwordControl, name: "password" }) ?? "";

  const applyOtpRequest = useCallback(
    (response: OtpRequestResponse, normalizedPhone: string) => {
      const now = Date.now();
      setPhone(normalizedPhone);
      setRequestId(response.requestId);
      setExpiresAt(now + (response.expiresInMs ?? OTP_RULES.expiresInMs));
      setResendAt(now + (response.resendAfterMs ?? OTP_RULES.resendAfterMs));
      setAttemptsLeft(response.maxAttempts ?? OTP_RULES.maxAttempts);
      setDevOtp(response.devOtp ?? null);
      setSubmitError(null);
    },
    [],
  );

  const onPhoneSubmit = async (values: PhoneStepValues) => {
    const normalized = normalizePkPhone(values.phone);
    if (!normalized) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = isCustomer
        ? await requestCustomerOtp(normalized)
        : await requestWorkerOtp(normalized);
      applyOtpRequest(
        { ...response, phone: response.phone ?? normalized },
        normalized,
      );
      setStep("otp");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (channel: "sms" | "whatsapp") => {
    if (!phone) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = isCustomer
        ? await resendCustomerOtp(phone, channel)
        : await resendWorkerOtp(phone, channel);
      applyOtpRequest(response, phone);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (values: { code: string }) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isCustomer) {
        await verifyCustomerOtp(requestId, values.code, phone);
      } else {
        await verifyWorkerOtp(requestId, values.code, phone);
      }
      setStep("password");
    } catch (error) {
      const payload = getApiErrorPayload(error);
      const attempts = payload?.attemptsLeft;
      if (typeof attempts === "number") {
        setAttemptsLeft(attempts);
      } else {
        setAttemptsLeft((current) =>
          current === null ? current : Math.max(0, current - 1),
        );
      }
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onPasswordSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Simulate password reset completion
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStep("success");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const signInHref = isCustomer ? "/customer/sign-in" : "/worker/sign-in";

  if (step === "otp") {
    return (
      <OtpStep
        phone={formatPkPhone(phone)}
        expiresAt={expiresAt}
        resendAt={resendAt}
        attemptsLeft={attemptsLeft}
        submitting={submitting}
        submitError={submitError}
        devOtp={devOtp}
        onEdit={() => {
          setStep("phone");
          setSubmitError(null);
        }}
        onResend={handleResend}
        onSubmit={handleVerifyOtp}
      />
    );
  }

  if (step === "password") {
    const rules = [
      { label: "At least 8 characters", met: passwordVal.length >= 8 },
      { label: "Contains a letter", met: /[a-zA-Z]/.test(passwordVal) },
      { label: "Contains a number", met: /\d/.test(passwordVal) },
    ];

    return (
      <form
        onSubmit={handlePasswordSubmitForm(onPasswordSubmit)}
        className="flex flex-1 flex-col"
        noValidate
      >
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
            <KeyRound className="size-3.5" />
            Security Reset
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">
            Create New Password
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Set a strong new password for {formatPkPhone(phone)}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="ml-1 block text-xs font-semibold text-navy"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...registerPassword("password")}
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className="pl-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordErrors.password ? (
              <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
                <AlertCircle className="size-3.5 shrink-0" />
                {passwordErrors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="ml-1 block text-xs font-semibold text-navy"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                {...registerPassword("confirmPassword")}
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                className="pl-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordErrors.confirmPassword ? (
              <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
                <AlertCircle className="size-3.5 shrink-0" />
                {passwordErrors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {/* Password checklist */}
          <ul className="space-y-1 rounded-2xl bg-slate-50 p-3">
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

        <div className="mt-auto pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="h-13 w-full rounded-full text-base font-semibold shadow-lg shadow-teal/25 bg-teal hover:bg-teal/90 text-white"
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="size-5 rtl:rotate-180" />
              </>
            )}
          </Button>
        </div>
      </form>
    );
  }

  if (step === "success") {
    return (
      <div className="text-center py-6 flex flex-1 flex-col justify-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <ShieldCheck className="size-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Password Reset Complete
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          Your password for {formatPkPhone(phone)} has been updated successfully. You can now sign in with your new password.
        </p>
        <div className="mt-8">
          <Button
            type="button"
            onClick={() => router.push(signInHref)}
            className="w-full h-13 rounded-full bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition shadow-lg shadow-teal/20"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Step === "phone"
  return (
    <form
      onSubmit={handlePhoneSubmitForm(onPhoneSubmit)}
      className="flex flex-1 flex-col"
      noValidate
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
          {isCustomer ? (
            <>
              <Home className="size-3.5" />
              Customer Support
            </>
          ) : (
            <>
              <Wrench className="size-3.5" />
              Worker Support
            </>
          )}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy">
          Forgot Password?
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Enter your registered mobile number to receive a verification code
        </p>
      </div>

      <div className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="reset-phone"
            className="ml-1 block text-xs font-semibold text-navy"
          >
            {t("phoneLabel")}
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...registerPhone("phone")}
              id="reset-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("phonePlaceholder")}
              aria-invalid={phoneErrors.phone ? true : undefined}
              className="pl-11"
            />
          </div>
          {phoneErrors.phone ? (
            <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
              <AlertCircle className="size-3.5 shrink-0" />
              {phoneErrors.phone.message}
            </p>
          ) : (
            <p className="ml-1 text-xs text-muted-foreground">
              We&apos;ll send a 6-digit OTP code to verify your account
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal/5 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-teal">
            <ShieldCheck className="size-3.5" />
            Secure Verification
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            For security, password reset requires OTP verification sent to your registered phone number.
          </p>
        </div>

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
          className="h-14 w-full rounded-full text-base font-semibold shadow-lg shadow-teal/25 bg-teal hover:bg-teal/90 text-white"
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <span>Send Verification Code</span>
              <ArrowRight className="size-5 rtl:rotate-180" />
            </>
          )}
        </Button>

        <div className="mt-4 text-center">
          <Link
            href={signInHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </form>
  );
}
