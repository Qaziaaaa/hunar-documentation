import { AuthTopBar } from "./auth-top-bar";
import { AuthTrustFooter } from "./auth-trust-footer";

export function AuthShell({
  children,
  hideHelp,
}: {
  children: React.ReactNode;
  hideHelp?: boolean;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-background text-foreground">
      <main
        data-purpose="auth-mobile-frame"
        className="flex min-h-svh w-full max-w-md flex-col bg-white shadow-2xl sm:my-6 sm:min-h-[820px] sm:rounded-3xl sm:border sm:border-slate-100"
      >
        <AuthTopBar />
        <div className="flex flex-1 flex-col px-6 pb-6 pt-4" data-purpose="auth-content">
          {children}
        </div>
        {!hideHelp ? <AuthTrustFooter /> : null}
      </main>
    </div>
  );
}