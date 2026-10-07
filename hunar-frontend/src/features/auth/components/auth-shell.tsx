"use client";

import { Activity, ArrowLeft, Lock, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { AuthTopBar } from "./auth-top-bar";
import { AuthTrustFooter } from "./auth-trust-footer";
import { CustomerAuthShowcase } from "./customer-auth-showcase";
import { WorkerAuthShowcase } from "./worker-auth-showcase";
import { Link, usePathname } from "@/i18n/navigation";

export interface AuthShellProps {
  children: React.ReactNode;
  hideHelp?: boolean;
  adminDesktopLayout?: boolean;
  role?: "customer" | "worker" | "admin";
}

export function AuthShell({
  children,
  hideHelp,
  adminDesktopLayout = false,
  role,
}: AuthShellProps) {
  const pathname = usePathname() || "";

  // Strictly identify Admin to ensure Admin remains completely untouched
  const isAdmin =
    adminDesktopLayout ||
    role === "admin" ||
    pathname.includes("/admin");

  // Determine role for Customer/Worker
  const resolvedRole =
    role ||
    (pathname.includes("/worker") || pathname.includes("/signup/worker")
      ? "worker"
      : "customer");

  // =========================================================================
  // ADMIN AUTHENTICATION LAYOUT (DO NOT MODIFY - OUT OF SCOPE)
  // =========================================================================
  if (isAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center bg-background text-foreground lg:p-0">
        <main
          data-purpose="auth-mobile-frame"
          className="flex min-h-svh w-full flex-col bg-white shadow-2xl sm:rounded-3xl sm:border sm:border-slate-100 h-svh max-w-none rounded-none border-0 lg:grid lg:min-h-svh lg:grid-cols-12 lg:overflow-hidden"
        >
          <aside className="hidden flex-col justify-between bg-navy p-10 text-white lg:col-span-7 lg:flex relative overflow-hidden">
            {/* Ambient Background Accents */}
            <div className="absolute -left-20 -top-20 size-80 rounded-full bg-teal/20 blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 size-96 rounded-full bg-navy-light/40 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-teal text-xl font-black text-white shadow-lg shadow-teal/25">
                  H
                </div>
                <div>
                  <p className="text-xl font-extrabold tracking-tight">HUNAR</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
                    Operations &amp; Admin Portal
                  </p>
                </div>
              </div>
              <div className="mt-14 max-w-lg">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-200 backdrop-blur-md">
                  <ShieldCheck className="size-4 text-teal-300" />
                  Enterprise Administrative Security
                </span>
                <h1 className="mt-5 text-4xl font-black leading-[1.18] tracking-tight">
                  Keep every marketplace operation seamless &amp; trusted.
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Real-time worker verification, live job tracking, and complete control
                  over customer payments and dispute resolution from one central command dashboard.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 pt-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition duration-200 hover:bg-white/10">
                <Activity className="size-5 text-teal-300" />
                <p className="mt-2 text-base font-bold">Live Oversight</p>
                <p className="mt-1 text-xs text-slate-300">Real-time marketplace monitoring</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition duration-200 hover:bg-white/10">
                <Users className="size-5 text-teal-300" />
                <p className="mt-2 text-base font-bold">Verified Network</p>
                <p className="mt-1 text-xs text-slate-300">Screened workers &amp; authentic reviews</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition duration-200 hover:bg-white/10">
                <LockKeyhole className="size-5 text-teal-300" />
                <p className="mt-2 text-base font-bold">Escrow Protection</p>
                <p className="mt-1 text-xs text-slate-300">Automated payment protection</p>
              </div>
            </div>
          </aside>

          <section className="flex min-h-svh flex-col lg:col-span-5 lg:min-h-0 justify-center">
            <div className="lg:hidden">
              <AuthTopBar />
            </div>
            <div
              className="flex flex-1 flex-col px-6 pb-6 pt-4 sm:px-10 lg:px-20 lg:py-16"
              data-purpose="auth-content"
            >
              {children}
            </div>
            {!hideHelp ? (
              <div className="lg:hidden">
                <AuthTrustFooter />
              </div>
            ) : null}
            <div className="hidden items-center justify-center gap-2 pb-8 text-xs text-muted-foreground lg:flex">
              <LockKeyhole className="size-3.5 text-teal" />
              Protected administrative session
            </div>
          </section>
        </main>
      </div>
    );
  }

  // =========================================================================
  // CUSTOMER & WORKER AUTHENTICATION LAYOUT
  // Mobile (< lg): Unchanged mobile frame, spacing, buttons, inputs, footers
  // Desktop (lg+): Clean Light Split Screen, Zero Scroll Guarantee
  // =========================================================================
  const isCustomer = resolvedRole === "customer";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-100/60 text-slate-800 lg:h-screen lg:max-h-screen lg:min-h-0 lg:overflow-hidden lg:p-4 xl:p-6">
      <main
        data-purpose="auth-mobile-frame"
        className="flex min-h-svh w-full flex-col bg-white shadow-2xl sm:my-6 sm:min-h-[820px] sm:max-w-md sm:rounded-3xl sm:border sm:border-slate-100 lg:my-0 lg:h-full lg:max-h-none lg:min-h-0 lg:max-w-5xl xl:max-w-6xl lg:rounded-3xl lg:border lg:border-slate-200/80 lg:shadow-xl lg:grid lg:grid-cols-12 lg:overflow-hidden"
      >
        {/* Left Column: Role-Specific Clean Desktop Showcase (Hidden on Mobile) */}
        {isCustomer ? <CustomerAuthShowcase /> : <WorkerAuthShowcase />}

        {/* Right Column: Form and Authentication Container (Zero Scroll on Desktop) */}
        <section className="flex min-h-svh w-full flex-1 flex-col justify-between bg-white lg:col-span-6 xl:col-span-5 lg:min-h-0 lg:h-full lg:overflow-hidden px-6 lg:px-8 xl:px-10 py-4">
          {/* Mobile Top Header (Hidden on Desktop) */}
          <div className="lg:hidden">
            <AuthTopBar />
          </div>

          {/* Desktop Top Header Bar (Visible on Desktop only) */}
          <div className="hidden lg:flex items-center justify-between pb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-navy"
            >
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Main Auth Content / Form Area */}
          <div
            className="flex flex-1 flex-col px-6 pb-6 pt-4 lg:px-0 lg:py-0 lg:justify-center lg:items-center"
            data-purpose="auth-content"
          >
            <div className="w-full max-w-[360px] flex flex-1 flex-col justify-center">
              {children}
            </div>
          </div>

          {/* Mobile Trust Footer (Hidden on Desktop) */}
          {!hideHelp ? (
            <div className="lg:hidden">
              <AuthTrustFooter />
            </div>
          ) : null}

          {/* Desktop Trust & Security Footer (Visible on Desktop only) */}
          <div className="hidden lg:flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="size-3 text-teal" />
              <span>256-bit SSL Encrypted &bull; NADRA CNIC Verified</span>
            </div>
            <a
              href="mailto:support@workerfix.pk"
              className="font-medium text-slate-500 hover:text-navy hover:underline"
            >
              Need help?
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}