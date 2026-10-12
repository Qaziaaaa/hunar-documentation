import type { ReactNode } from "react";

// Metadata lives here because the page itself is a client component (it must
// fetch admin data client-side — server components have no localStorage token).
export const metadata = {
  title: "Admin Dashboard — HUNAR Operations",
  description:
    "Live marketplace overview, analytics, financial ledger, infrastructure health, and worker verification management",
};

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
