"use client";

import {
  AlertTriangle,
  Bell,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileCheck2,
  FolderTree,
  LineChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";
import { adminApi } from "@/features/admin/api/admin-api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  type StoredUser,
} from "@/lib/api-client";

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

const AdminShellContext = createContext<{ openDrawer: () => void }>({
  openDrawer: () => {},
});

/** True when an admin access or refresh token exists (401s can silent-refresh). */
const hasAdminSession = () =>
  Boolean(getAccessToken("ADMIN") || getRefreshToken("ADMIN"));

/** Mobile drawer trigger — lives in the utility row (sample .page__menu). */
export function AdminMenuButton() {
  const { openDrawer } = useContext(AdminShellContext);
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={openDrawer}
      className="wf-icon-btn wf-util__menu"
    >
      <Menu className="size-5" />
    </button>
  );
}

/** Status pill + notifications + profile (sample page actions cluster). */
export function AdminUtilities() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [identity, setIdentity] = useState<StoredUser | null>(null);
  const [health, setHealth] = useState<"checking" | "ok" | "degraded" | "unavailable">("checking");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!hasAdminSession()) return;
    let alive = true;
    setIdentity(getStoredUser("ADMIN"));
    const tick = () => {
      adminApi
        .getHealth()
        .then((h) => {
          if (!alive) return;
          const allOk = h?.status === "ok" && h?.db === "ok" && h?.redis === "ok";
          setHealth(allOk ? "ok" : "degraded");
        })
        .catch(() => {
          if (alive) setHealth("unavailable");
        });
      adminApi
        .getUnreadNotificationCount()
        .then((n) => {
          if (alive) setUnread(n);
        })
        .catch(() => {});
    };
    tick();
    const id = setInterval(() => {
      if (!document.hidden) tick();
    }, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const handleSignOut = () => {
    clearTokens("ADMIN");
    router.push("/admin/sign-in");
  };

  const displayName = identity?.name || identity?.phone || "Admin";
  const displayEmail = identity?.email || identity?.phone || "No contact on file";
  const displayRole = identity?.role === "ADMIN" ? "Admin" : (identity?.role ?? "Admin");
  const initials =
    (displayName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "A").toUpperCase();

  const healthPill =
    health === "checking"
      ? { cls: "border-slate-200 bg-slate-50 text-slate-500", label: "Checking status…" }
      : health === "ok"
        ? { cls: "border-green-200 bg-green-50 text-green-700", label: "All Systems Operational" }
        : health === "degraded"
          ? { cls: "border-amber-200 bg-amber-50 text-amber-700", label: "Service degraded" }
          : { cls: "border-red-200 bg-red-50 text-red-700", label: "Status unavailable" };

  return (
    <div className="wf-util" data-testid="admin-utilities">
      {/* Live Operational Pulse — real /api/v1/health probe */}
      <div
        role="status"
        className={`hidden items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:flex ${healthPill.cls}`}
      >
        {health === "ok" ? (
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500 wf-dot" />
          </span>
        ) : (
          <span
            className={`inline-flex size-2 rounded-full ${
              health === "degraded"
                ? "bg-amber-500"
                : health === "unavailable"
                  ? "bg-red-500"
                  : "bg-slate-400"
            }`}
          />
        )}
        <span>{healthPill.label}</span>
      </div>

      {/* Notifications — real unread count */}
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-extrabold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {/* Admin Profile Menu — real session identity */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((val) => !val)}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-1 transition hover:bg-slate-50"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-navy text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[13px] font-extrabold text-navy leading-tight">{displayName}</p>
            <p className="text-[11px] font-semibold text-teal leading-tight">{displayRole}</p>
          </div>
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>

        {profileOpen ? (
          <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 wf-tray">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-[13px] font-bold text-navy">{displayName}</p>
              <p className="text-[11px] text-slate-500">{displayEmail}</p>
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
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Admin APIs require a session — with neither access nor refresh token the
  // dashboard would render as a shell of 401s, so bounce to sign-in instead.
  // (Sign-in lives outside this layout, so no redirect loop.)
  useEffect(() => {
    if (!getAccessToken("ADMIN") && !getRefreshToken("ADMIN")) {
      router.replace("/admin/sign-in");
    }
  }, [router]);

  // Sidebar badge — real pending-verification count, refreshed every 60s.
  useEffect(() => {
    if (!hasAdminSession()) return;
    let alive = true;
    const tick = () => {
      adminApi.getPendingVerificationCount().then((n) => {
        if (alive) setPendingCount(n);
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Sliding active-nav pill (sample Ld): animate y from previous offsetTop
  // with distance-based scaleY stretch. Shared layout keeps AdminShell mounted
  // so the pill never remounts from Dashboard on every route change.
  const navRef = useRef<HTMLElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const [pill, setPill] = useState({ top: 0, height: 0, visible: false });
  const lastTopRef = useRef(0);
  const firstMeasureRef = useRef(true);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[data-nav-active="true"]');
      const pillEl = pillRef.current;
      if (!active || !pillEl) {
        setPill((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const top = active.offsetTop;
      const height = active.offsetHeight;
      const first = firstMeasureRef.current;
      firstMeasureRef.current = false;
      const prevTop = lastTopRef.current;

      setPill({ top, height, visible: true });

      // Same slot (resize / RO re-measure): keep the current transform, skip tween.
      if (!first && top === prevTop) return;

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (first || reduced || typeof pillEl.animate !== "function") {
        pillEl.style.transform = `translateY(${top}px) scaleY(1)`;
        lastTopRef.current = top;
        return;
      }

      // Sample Ld: y .55s power3.inOut + scaleY [1, 1+min(dist/40,5)*.4, 1]
      // from the previous active item — not from a remounted Dashboard.
      const dist = Math.abs(top - prevTop);
      const stretch = 1 + Math.min(dist / 40, 5) * 0.4;
      pillEl.getAnimations().forEach((a) => a.cancel());
      const anim = pillEl.animate(
        [
          { transform: `translateY(${prevTop}px) scaleY(1)` },
          {
            transform: `translateY(${(prevTop + top) / 2}px) scaleY(${stretch})`,
            offset: 0.5,
          },
          { transform: `translateY(${top}px) scaleY(1)` },
        ],
        {
          duration: 550,
          easing: "cubic-bezier(0.645, 0.045, 0.355, 1)",
          fill: "both",
        },
      );
      lastTopRef.current = top;
      anim.onfinish = () => {
        // Drop fill so the next React style paint sticks cleanly.
        anim.cancel();
        pillEl.style.transform = `translateY(${top}px) scaleY(1)`;
      };
    };
    measure();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(nav);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pathname]);

  const searchRef = useRef<HTMLInputElement | null>(null);

  // Sample: ⌘K / Ctrl+K focuses the sidebar search
  const handleSearchShortcut = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [handleSearchShortcut]);

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
          ...(pendingCount > 0
            ? { badge: String(pendingCount), badgeColor: "bg-orange text-white" }
            : {}),
        },
        {
          label: "Jobs & Work Orders",
          href: "/admin/jobs",
          icon: Briefcase,
        },
        {
          label: "Visits & Inspection",
          href: "/admin/visits",
          icon: Calendar,
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
          label: "Reviews & Ratings",
          href: "/admin/reviews",
          icon: Star,
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
          label: "Reports",
          href: "/admin/reports",
          icon: LineChart,
        },
        {
          label: "Settings & Rules",
          href: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const openDrawer = useCallback(() => {
    setCollapsed(false);
    setMobileOpen(true);
  }, []);

  // `<` / `>` toggles the desktop rail (72px); also closes the drawer (≤1024).
  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => !c);
    setMobileOpen(false);
  }, []);

  return (
    <AdminShellContext.Provider value={{ openDrawer }}>
    <div
      className={`admin-glow admin-app text-slate-900 font-sans${
        collapsed ? " admin-app--rail" : ""
      }`}
    >
      {/* Mobile Drawer Overlay */}
      {mobileOpen ? (
        <div
          onClick={() => setMobileOpen(false)}
          className="wf-scrim"
        />
      ) : null}

      {/* Sidebar Navigation */}
      <aside
        data-testid="mobile-drawer"
        className={`wf-sidebar ${mobileOpen ? "wf-sidebar--open" : ""}`}
      >
        <div className="wf-sidebar__top">
          <Link href="/admin/dashboard" className="wf-brand">
            <WorkerFixLogo variant="dark" size="sm" showText={!collapsed} />
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Close menu"}
            onClick={toggleSidebar}
            className="wf-icon-btn wf-icon-btn--side wf-sidebar__close"
          >
            {collapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </button>
        </div>

        {/* Search — directly under the logo (sample) */}
        <form
          role="search"
          className="wf-search"
          onSubmit={(e) => e.preventDefault()}
          data-search-form
        >
          <label className="sr-only" htmlFor="admin-nav-search">
            Search
          </label>
          <Search className="wf-search__icon" aria-hidden />
          <input
            ref={searchRef}
            id="admin-nav-search"
            type="search"
            placeholder="Search"
            autoComplete="off"
            aria-keyshortcuts="Meta+K Control+K"
          />
          <kbd className="wf-search__kbd" aria-hidden>
            <span data-mod>⌘</span>K
          </kbd>
        </form>

        <div className="wf-sidebar__navs">
          {/* Navigation Links */}
          <nav ref={navRef} className="relative space-y-7">
            {/* Sliding active pill (behind the links) */}
            <span
              ref={pillRef}
              aria-hidden
              className="wf-navpill pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-navy"
              style={{
                height: pill.height,
                // transform is driven imperatively (WAAPI) so React never
                // snaps the pill to the destination before the tween starts.
                opacity: pill.visible ? 1 : 0,
                willChange: "transform",
              }}
            />
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="relative px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                        title={item.label}
                        data-nav-active={isActive ? "true" : undefined}
                        className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors duration-wharf ${
                          isActive
                            ? "text-white"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-navy"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`size-4 transition-colors duration-wharf ${
                              isActive
                                ? "text-teal-300"
                                : "text-slate-400 group-hover:text-navy"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide transition ${
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
        <div className="wf-sidebar__foot">
          <div className="flex items-center gap-3 rounded-2xl border border-teal/15 bg-teal/5 p-3">
            <ShieldCheck className="size-5 shrink-0 text-teal" />
            <div>
              <p className="text-[13px] font-bold text-navy">Verified Session</p>
              <p className="text-[11px] text-slate-500">Audit logs active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="wf-main-col">
        {/* Dynamic Main Body Content */}
        <main className="wf-main flex-1 overflow-y-auto min-h-0">
          {/* Borderless utility cluster — floats top-right of main (sample: bell in page header) */}
          <div className="wf-util-row">
            <AdminMenuButton />
            <AdminUtilities />
          </div>
          {children}
        </main>
      </div>
    </div>
    </AdminShellContext.Provider>
  );
}
