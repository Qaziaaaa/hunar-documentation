"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

const adminSignInSchema = z.object({
  email: z.string().email("Please enter a valid admin email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type AdminSignInValues = z.infer<typeof adminSignInSchema>;

export function AdminSignInForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminSignInValues>({
    resolver: zodResolver(adminSignInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onTouched",
  });

  const onSubmit = async (values: AdminSignInValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Simulate Admin Login (Mock Data mode until backend API is ready)
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (values.email === "admin@hunar.pk" || values.email.endsWith("@hunar.pk") || values.password === "admin123") {
        // Save mock admin session
        if (typeof window !== "undefined") {
          localStorage.setItem("hunar_admin_token", "mock-admin-jwt-token-12345");
          localStorage.setItem(
            "hunar_admin_user",
            JSON.stringify({
              id: "admin-1",
              name: "System Administrator",
              email: values.email,
              role: "ADMIN",
            })
          );
        }
        router.push("/admin/dashboard");
      } else {
        // Allow fallback demo sign in for testing
        if (typeof window !== "undefined") {
          localStorage.setItem("hunar_admin_token", "mock-admin-jwt-token-demo");
          localStorage.setItem(
            "hunar_admin_user",
            JSON.stringify({
              id: "admin-demo",
              name: values.email.split("@")[0] || "Admin",
              email: values.email,
              role: "ADMIN",
            })
          );
        }
        router.push("/admin/dashboard");
      }
    } catch {
      setSubmitError("Invalid admin credentials or server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-[520px] flex-1 flex-col"
      noValidate
    >
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-navy/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
          <ShieldCheck className="size-3.5 text-teal" />
          Platform Admin Portal
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-navy">
          Admin Sign In
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Enter your administrative credentials to access operations control
        </p>
      </div>

      <div className="mt-10 space-y-5">
        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="admin-email"
            className="ml-1 block text-xs font-semibold text-navy"
          >
            Admin Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...register("email")}
              id="admin-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="admin@hunar.pk"
              aria-invalid={errors.email ? true : undefined}
              className="h-12 rounded-xl pl-11"
            />
          </div>
          {errors.email ? (
            <p className="ml-1 flex items-center gap-1 text-xs font-medium text-error">
              <AlertCircle className="size-3.5 shrink-0" />
              {errors.email.message}
            </p>
          ) : null}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="admin-password"
              className="ml-1 block text-xs font-semibold text-navy"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              {...register("password")}
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-invalid={errors.password ? true : undefined}
              className="h-12 rounded-xl pl-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((val) => !val)}
              aria-label={showPassword ? "Hide password" : "Show password"}
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

        {/* Remember me option */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="size-4 rounded border-slate-300 text-teal focus:ring-teal"
            />
            Remember session
          </label>
        </div>

        {submitError ? (
          <p className="flex items-start gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-xs font-medium text-error">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {submitError}
          </p>
        ) : null}

        <div className="flex items-center gap-1.5 rounded-xl border border-teal/10 bg-teal/5 px-3 py-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-teal shrink-0" />
          <span>Restricted administrative access. All logins are logged.</span>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-14 w-full rounded-xl bg-navy text-base font-semibold shadow-lg shadow-navy/20 hover:bg-navy/90"
        >
          {submitting ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <>
              <span>Sign In to Admin Dashboard</span>
              <ArrowRight className="size-5 rtl:rotate-180" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
