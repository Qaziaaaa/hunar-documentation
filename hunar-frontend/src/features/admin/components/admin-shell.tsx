"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  ChevronDown,
  CreditCard,
  FileCheck2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hunar_admin_token");
      localStorage.removeItem("hunar_admin_user");
    }
    router.push("/admin/sign-in");
  };

  const navGroups: NavGroup[] = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          badge: "Live",
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Customers",
          href: "/admin/users/customers",
          icon: Users,
        },
        {
          label: "Workers",
          href: "/admin/users/workers",
          icon: UserCheck,
        },
        {
          label: "Verifications",
          href: "/admin/verifications",
          icon: FileCheck2,
          badge: "3 Pending",
          badgeColor: "bg-orange text-white",
        },
        {
          label: "Jobs & Work Orders",
          href: "/admin/jobs",
          icon: Briefcase,
        },
      ],
    },
    {
      title: "Governance",
      items: [
        {
          label: "Payments & Escrow",
          href: "/admin/payments",
          icon: CreditCard,
        },
        {
          label: "Disputes & Support",
          href: "/admin/disputes",
          icon: AlertTriangle,
        },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: FolderTree,
        },
        {
          label: "Settings & Rules",
          href: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileOpen ? (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-5 py-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-navy text-xl font-black text-white shadow-md shadow-navy/20">
                <span>H</span>
                <span className="size-2.5 rounded-full bg-teal" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-navy">
                    HUNAR
                  </span>
                  <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-teal border border-teal/20">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Operations Control Center
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-7">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? "bg-navy text-white shadow-md shadow-navy/20"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-navy"
                        }`}
                      >
                        {isActive ? (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-teal shadow-sm shadow-teal" />
                        ) : null}
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`size-4 transition-colors ${
                              isActive
                                ? "text-teal-300"
                                : "text-slate-400 group-hover:text-navy"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                              item.badgeColor ||
                              (isActive
                                ? "bg-teal text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200")
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Support Info */}
        <div className="border-t border-slate-100 p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-teal/15 bg-teal/5 p-3">
            <ShieldCheck className="size-5 shrink-0 text-teal" />
            <div>
              <p className="text-xs font-bold text-navy">Verified Session</p>
              <p className="text-[10px] text-slate-500">Audit logs active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="relative hidden w-72 md:block">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs, workers, users..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Operational Pulse */}
            <div className="hidden items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              <span>All Systems Operational</span>
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-orange" />
            </button>

            {/* Admin Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((val) => !val)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-1.5 transition hover:bg-slate-50"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white">
                  SA
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-extrabold text-navy">System Admin</p>
                  <p className="text-[10px] font-semibold text-teal">SUPER ADMIN</p>
                </div>
                <ChevronDown className="size-4 text-slate-400" />
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-bold text-navy">System Admin</p>
                    <p className="text-[10px] text-slate-500">admin@hunar.pk</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-error hover:bg-error/10"
                  >
                    <LogOut className="size-4" />
                    Sign Out Session
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
