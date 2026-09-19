import { Activity, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { AuthTopBar } from "./auth-top-bar";
import { AuthTrustFooter } from "./auth-trust-footer";

export function AuthShell({
  children,
  hideHelp,
  adminDesktopLayout = false,
}: {
  children: React.ReactNode;
  hideHelp?: boolean;
  adminDesktopLayout?: boolean;
}) {
  return (
    <div
      className={`flex min-h-svh flex-col items-center bg-background text-foreground ${
        adminDesktopLayout ? "lg:p-0" : "lg:p-6"
      }`}
    >
      <main
        data-purpose="auth-mobile-frame"
        className={`flex min-h-svh w-full flex-col bg-white shadow-2xl sm:rounded-3xl sm:border sm:border-slate-100 ${
          adminDesktopLayout
            ? "h-svh max-w-none rounded-none border-0 lg:grid lg:min-h-svh lg:grid-cols-12 lg:overflow-hidden"
            : "max-w-md sm:my-6 sm:min-h-[820px]"
        }`}
      >
        {adminDesktopLayout ? (
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
                    Operations & Admin Portal
                  </p>
                </div>
              </div>
              <div className="mt-14 max-w-lg">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-200 backdrop-blur-md">
                  <ShieldCheck className="size-4 text-teal-300" />
                  Enterprise Administrative Security
                </span>
                <h1 className="mt-5 text-4xl font-black leading-[1.18] tracking-tight">
                  Keep every marketplace operation seamless & trusted.
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
                <p className="mt-1 text-xs text-slate-300">Screened workers & authentic reviews</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition duration-200 hover:bg-white/10">
                <LockKeyhole className="size-5 text-teal-300" />
                <p className="mt-2 text-base font-bold">Escrow Protection</p>
                <p className="mt-1 text-xs text-slate-300">Automated payment protection</p>
              </div>
            </div>
          </aside>
        ) : null}
        <section
          className={
            adminDesktopLayout
              ? "flex min-h-svh flex-col lg:col-span-5 lg:min-h-0 justify-center"
              : "flex min-h-svh flex-col"
          }
        >
          <div className={adminDesktopLayout ? "lg:hidden" : undefined}>
            <AuthTopBar />
          </div>
          <div
            className={`flex flex-1 flex-col px-6 pb-6 pt-4 ${
              adminDesktopLayout ? "sm:px-10 lg:px-20 lg:py-16" : ""
            }`}
            data-purpose="auth-content"
          >
            {children}
          </div>
          {!hideHelp ? (
            <div className={adminDesktopLayout ? "lg:hidden" : undefined}>
              <AuthTrustFooter />
            </div>
          ) : null}
          {adminDesktopLayout ? (
            <div className="hidden items-center justify-center gap-2 pb-8 text-xs text-muted-foreground lg:flex">
              <LockKeyhole className="size-3.5 text-teal" />
              Protected administrative session
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}