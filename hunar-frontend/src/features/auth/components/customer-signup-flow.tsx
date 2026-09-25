"use client";

import { useCallback, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { setTokens } from "@/lib/api-client";
import {
  OTP_RULES,
  completeCustomerSignup,
  requestCustomerOtp,
  resendCustomerOtp,
  verifyCustomerOtp,
  type OtpRequestResponse,
} from "../api/auth-api";
import { getApiErrorPayload, getErrorMessage } from "../lib/error";
import { formatPkPhone, normalizePkPhone } from "../lib/phone";
import type {
  OtpFormValues,
  PasswordFormValues,
  PhoneFormValues,
} from "../schemas/signup";
import { useLocale } from "next-intl";
import { OtpStep } from "./otp-step";
import { PasswordStep } from "./password-step";
import { PhoneStep } from "./phone-step";

type Step = "phone" | "otp" | "password" | "success";

export function CustomerSignupFlow() {
  const router = useRouter();
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const applyOtpRequest = useCallback(
    (response: OtpRequestResponse, normalizedPhone: string) => {
      const now = Date.now();
      setPhone(normalizedPhone);
      setRequestId(response.requestId);
      setExpiresAt(now + (response.expiresInMs ?? OTP_RULES.expiresInMs));
      setResendAt(now + (response.resendAfterMs ?? OTP_RULES.resendAfterMs));
      setAttemptsLeft(response.maxAttempts ?? OTP_RULES.maxAttempts);
      setSubmitError(null);
    },
    [],
  );

  const handlePhoneSubmit = async (values: PhoneFormValues) => {
    const normalized = normalizePkPhone(values.phone);
    if (!normalized) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await requestCustomerOtp(normalized);
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
      const response = await resendCustomerOtp(phone, channel);
      applyOtpRequest(response, phone);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (values: OtpFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await verifyCustomerOtp(requestId, values.code, phone);
      setVerificationId(response.verificationId);
      if (typeof response.attemptsLeft === "number") {
        setAttemptsLeft(response.attemptsLeft);
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

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await completeCustomerSignup({
        phone,
        verificationId,
        password: values.password,
      });
      setTokens(response.accessToken, response.refreshToken, response.user);
      setStep("success");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "otp") {
    return (
      <OtpStep
        phone={formatPkPhone(phone)}
        expiresAt={expiresAt}
        resendAt={resendAt}
        attemptsLeft={attemptsLeft}
        submitting={submitting}
        submitError={submitError}
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
    return (
      <PasswordStep
        submitting={submitting}
        submitError={submitError}
        onSubmit={handlePasswordSubmit}
      />
    );
  }

  if (step === "success") {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {isUrdu ? "WorkerFIX میں خوش آمدید!" : "Welcome to WorkerFIX!"}
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          {isUrdu
            ? `آپ کا کسٹمر اکاؤنٹ ${formatPkPhone(phone)} کے لیے بن گیا ہے۔ اب آپ جاب پوسٹ کر سکتے ہیں اور تصدیق شدہ کاریگر بلوا سکتے ہیں۔`
            : `Your customer account has been created for ${formatPkPhone(phone)}. You can now post jobs, receive direct visit quotes, and book verified professionals.`}
        </p>
        <button
          type="button"
          onClick={() => router.push("/customer/dashboard")}
          className="mt-6 w-full py-3 px-4 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors shadow-xs"
        >
          {isUrdu ? "کسٹمر ڈیش بورڈ پر جائیں" : "Go to Customer Dashboard"}
        </button>
      </div>
    );
  }

  return (
    <PhoneStep
      submitting={submitting}
      submitError={submitError}
      onSubmit={handlePhoneSubmit}
    />
  );
}
