"use client";

import { useCallback, useState } from "react";
import { setTokens } from "@/lib/api-client";
import {
  OTP_RULES,
  completeWorkerSignup,
  requestWorkerOtp,
  resendWorkerOtp,
  verifyWorkerOtp,
  type OtpRequestResponse,
} from "../api/auth-api";
import { getApiErrorPayload, getErrorMessage } from "../lib/error";
import { formatPkPhone, normalizePkPhone } from "../lib/phone";
import type {
  OtpFormValues,
  PasswordFormValues,
  PhoneFormValues,
} from "../schemas/signup";
import { OtpStep } from "./otp-step";
import { PasswordStep } from "./password-step";
import { PhoneStep } from "./phone-step";
import { SignupSuccess } from "./signup-success";

type Step = "phone" | "otp" | "password" | "success";

export function WorkerSignupFlow() {
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
      const response = await requestWorkerOtp(normalized);
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
      const response = await resendWorkerOtp(phone, channel);
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
      const response = await verifyWorkerOtp(requestId, values.code, phone);
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
      const response = await completeWorkerSignup({
        phone,
        verificationId,
        password: values.password,
      });
      setTokens(response.accessToken, response.refreshToken);
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
    return <SignupSuccess phone={formatPkPhone(phone)} />;
  }

  return (
    <PhoneStep
      submitting={submitting}
      submitError={submitError}
      onSubmit={handlePhoneSubmit}
    />
  );
}