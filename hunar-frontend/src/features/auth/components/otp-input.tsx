"use client";

import { useRef } from "react";
import { cn } from "cn";

const OTP_LENGTH = 6;

export function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  const commit = (next: string[]) => {
    onChange(next.join("").slice(0, OTP_LENGTH));
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;

    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH);
      onChange(pasted);
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = value.split("");
    next[index] = clean;
    commit(next);
    if (index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (digits[index]) return;
      if (index > 0) {
        event.preventDefault();
        const next = value.split("");
        next[index - 1] = "";
        commit(next);
        refs.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onPaste={handlePaste}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit ${index + 1}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          className={cn(
            "h-14 w-11 rounded-2xl border-2 text-center text-xl font-bold text-navy shadow-sm transition-all outline-none focus:border-teal focus:ring-4 focus:ring-teal/15 disabled:opacity-60 sm:w-12",
            digit ? "border-teal bg-teal/10" : "border-slate-200 bg-white",
            invalid && "border-error bg-error/5",
          )}
        />
      ))}
    </div>
  );
}