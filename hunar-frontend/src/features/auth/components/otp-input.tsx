"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

const OTP_LENGTH = 6;

const toSlots = (val: string) =>
  Array.from({ length: OTP_LENGTH }, (_, i) => val[i] ?? "");

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
  const [slots, setSlots] = useState<string[]>(() => toSlots(value));
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setSlots(toSlots(value));
    }
  }, [value]);

  const emit = (next: string[]) => {
    const collapsed = next.join("").slice(0, OTP_LENGTH);
    lastEmittedRef.current = collapsed;
    setSlots(next);
    onChange(collapsed);
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      if (raw === "") {
        const next = [...slots];
        next[index] = "";
        emit(next);
      }
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, OTP_LENGTH);
      emit(toSlots(pasted));
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    const next = [...slots];
    next[index] = clean;
    emit(next);
    if (index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    emit(toSlots(pasted));
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...slots];
      if (next[index]) {
        next[index] = "";
        emit(next);
      } else if (index > 0) {
        next[index - 1] = "";
        emit(next);
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
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 mx-auto w-full" dir="ltr">
      {slots.map((digit, index) => (
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
            "h-13 w-10 sm:h-14 sm:w-12 rounded-xl sm:rounded-2xl border-2 text-center text-lg sm:text-xl font-bold text-navy shadow-xs sm:shadow-sm transition-all outline-none focus:border-teal focus:ring-4 focus:ring-teal/15 disabled:opacity-60",
            digit ? "border-teal bg-teal/10" : "border-slate-200 bg-white",
            invalid && "border-error bg-error/5",
          )}
        />
      ))}
    </div>
  );
}
