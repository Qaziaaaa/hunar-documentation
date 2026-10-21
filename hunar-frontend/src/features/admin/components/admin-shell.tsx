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
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
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
import { routing } from "@/i18n/routing";
import { timeAgo } from "@/lib/format";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";
import { adminApi } from "@/features/admin/api/admin-api";
import type { AdminNotification } from "@/types/admin";
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

/** Admin theme: localStorage (pre-paint script) + html[data-theme]. */
const THEME_KEY = "workerfix.admin.theme";
type ThemeChoice = "light" | "dark";
const THEME_OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** Static g-then-letter route chords (g d/j/w/c/v/t/s/r). */
const G_SHORTCUTS: Record<string, string> = {
  d: "/admin/dashboard",
  j: "/admin/jobs",
  w: "/admin/users/workers",
  c: "/admin/users/customers",
  v: "/admin/verifications",
  t: "/admin/visits",
  s: "/admin/settings",
  r: "/admin/reports",
};

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
  // Lazy client identity: server renders the null fallback (no window),
  // client hydrates from localStorage; suppressHydrationWarning on the
  // header text nodes covers the one-level mismatch until the first state
  // update (health/unread) re-renders them. No effect setState needed.
  const [identity] = useState<StoredUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return getStoredUser("ADMIN");
    } catch {
      return null;
    }
  });
  const [health, setHealth] = useState<"checking" | "ok" | "degraded" | "unavailable">("checking");
  const [unread, setUnread] = useState(0);
  const badgeRef = useRef<HTMLSpanElement | null>(null);

  // Theme (light / dark / system). The pre-paint script already set
  // html[data-theme] before first paint; state lazy-inits from the same
  // key (Next hydration guide) with suppressHydrationWarning on the chips —
  // effects only re-apply on change and never write localStorage (a remount
  // would race the sync and clobber the stored choice).
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {
      /* storage unavailable */
    }
    return "light";
  });
  useLayoutEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute(
        "data-theme",
        themeChoice === "dark" ? "dark" : "light",
      );
    };
    apply();
  }, [themeChoice]);
  const pickTheme = (value: ThemeChoice) => {
    setThemeChoice(value);
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch {
      /* storage unavailable */
    }
  };

  // Notification tray — bell popover (sample .wf-tray shadow + our APIs).
  const [trayOpen, setTrayOpen] = useState(false);
  const [trayItems, setTrayItems] = useState<AdminNotification[] | null>(null);
  const [trayState, setTrayState] = useState<"loading" | "ready" | "error">("loading");
  const trayWrapRef = useRef<HTMLDivElement | null>(null);
  const trayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!trayOpen) return;
    let alive = true;
    adminApi
      .listNotifications({ limit: 6 })
      .then((res) => {
        if (!alive) return;
        setTrayItems(res.items);
        setTrayState("ready");
      })
      .catch(() => {
        if (alive) setTrayState("error");
      });
    return () => {
      alive = false;
    };
  }, [trayOpen]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!trayOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!trayWrapRef.current?.contains(event.target as Node)) setTrayOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTrayOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [trayOpen]);

  // Tray enter: rise + fade (sample tray timing family).
  useEffect(() => {
    if (!trayOpen) return;
    const el = trayRef.current;
    if (!el || process.env.NODE_ENV === "test") return;
    if (typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.animate(
      [
        { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
        { opacity: 1, transform: "translateY(0px) scale(1)" },
      ],
      { duration: 220, easing: "cubic-bezier(0.215, 0.61, 0.355, 1)", fill: "both" },
    );
    a.onfinish = () => a.cancel();
  }, [trayOpen]);

  // Sample counter pop: when the unread delta lands, badge svg (or badge
  // itself) scales .7 → 1 with back.out(3).
  useEffect(() => {
    const el = badgeRef.current;
    if (!el || process.env.NODE_ENV === "test") return;
    if (typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.getAnimations().forEach((a) => a.cancel());
    const a = el.animate(
      [{ transform: "scale(0.7)" }, { transform: "scale(1)" }],
      {
        duration: 550,
        easing: "cubic-bezier(0.34, 2.2, 0.64, 1)",
        fill: "both",
      },
    );
    a.onfinish = () => a.cancel();
  }, [unread]);

  useEffect(() => {
    if (!hasAdminSession()) return;
    let alive = true;
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

      {/* Notifications — unread count + animated tray */}
      <div className="relative" ref={trayWrapRef}>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
          aria-haspopup="dialog"
          aria-expanded={trayOpen}
          onClick={() => {
            setProfileOpen(false);
            const next = !trayOpen;
            if (next) {
              // reset in the user event (lint-safe), not the fetch effect
              setTrayState("loading");
              setTrayItems(null);
            }
            setTrayOpen(next);
          }}
          className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span
              ref={badgeRef}
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-extrabold leading-none text-white"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>

        {trayOpen ? (
          <div
            ref={trayRef}
            role="dialog"
            aria-label="Notifications"
            className="wf-tray absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <p className="text-[13px] font-bold text-navy">Notifications</p>
              <span className="text-[11px] font-semibold text-slate-400">
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </span>
            </div>

            {trayState === "loading" && trayItems === null ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="wf-shimmer h-10 rounded-xl" />
                ))}
              </div>
            ) : trayState === "error" ? (
              <p className="px-3 py-4 text-xs font-semibold text-slate-500">
                Couldn&apos;t load notifications.
              </p>
            ) : !trayItems || trayItems.length === 0 ? (
              <p className="px-3 py-4 text-xs font-semibold text-slate-500">
                Nothing here yet.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {trayItems.map((n) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2 ${
                      n.isRead ? "opacity-70" : "bg-teal/5"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${
                        n.isRead ? "bg-slate-300" : "bg-teal"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-navy">{n.title}</p>
                      <p className="line-clamp-2 text-[11px] text-slate-500">{n.body}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-slate-100 p-1.5">
              <Link
                href="/admin/notifications"
                onClick={() => setTrayOpen(false)}
                className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-bold text-teal transition hover:bg-teal/5"
              >
                View all notifications
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* Admin Profile Menu — real session identity */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((val) => !val)}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-1 transition hover:bg-slate-50"
        >
          <div
            suppressHydrationWarning
            className="flex size-7 items-center justify-center rounded-lg bg-navy text-[11px] font-bold text-white"
          >
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p suppressHydrationWarning className="text-[13px] font-extrabold text-navy leading-tight">{displayName}</p>
            <p suppressHydrationWarning className="text-[11px] font-semibold text-teal leading-tight">{displayRole}</p>
          </div>
          <ChevronDown className="size-3.5 text-slate-400" />
        </button>

        {profileOpen ? (
          <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 wf-tray">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-[13px] font-bold text-navy">{displayName}</p>
              <p className="text-[11px] text-slate-500">{displayEmail}</p>
            </div>
            <div
              role="group"
              aria-label="Theme"
              className="mt-1 flex items-center gap-1 rounded-xl bg-slate-50 p-1"
            >
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  aria-pressed={themeChoice === value}
                  suppressHydrationWarning
                  onClick={() => pickTheme(value)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                    themeChoice === value
                      ? "bg-white text-navy shadow-sm"
                      : "text-slate-500 hover:text-navy"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
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

  // Sample Hd route exit: visible page root + [data-card] fade to opacity 0
  // / y-10, .2s power2.in, stagger .012, THEN navigate. Intercept nav-link
  // clicks in the capture phase (Link's own onClick still runs — drawer
  // close etc.). Enter: scroll main to top, focus the new h1, and fly the
  // page's content blocks in (sample co: y30 scale.985, .8s stagger .06) —
  // the dashboard (.wf-view) owns its own entrance, so it is skipped here.
  const mainRef = useRef<HTMLElement | null>(null);
  const navigatingRef = useRef(false);
  const firstPathRef = useRef(true);

  const stripLocale = useCallback((href: string) => {
    const clean = href.split(/[?#]/)[0];
    const segs = clean.split("/");
    if (segs[1] && (routing.locales as readonly string[]).includes(segs[1])) {
      return "/" + segs.slice(2).join("/");
    }
    return clean;
  }, []);

  const handleExitCapture = useCallback(
    (event: React.MouseEvent) => {
      if (navigatingRef.current) {
        event.preventDefault();
        return;
      }
      if (process.env.NODE_ENV === "test") return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button !== 0) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      const raw = anchor.getAttribute("href") || "";
      if (!raw.startsWith("/")) return;
      const dest = stripLocale(raw);
      if (dest === pathname || !dest.startsWith("/admin")) return;
      if (typeof anchor.animate !== "function") return;
      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;

      event.preventDefault();
      navigatingRef.current = true;

      const main = mainRef.current;
      const root = main
        ? (Array.from(main.children).find(
            (el) => !el.classList.contains("wf-util-row"),
          ) as HTMLElement | undefined)
        : undefined;
      const cards = root
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-card]"))
        : [];
      const targets = [root, ...cards].filter(
        (el): el is HTMLElement => Boolean(el && el.offsetParent !== null),
      );
      const anims = targets.map((el, i) =>
        el.animate(
          [
            { opacity: 1, transform: "translateY(0px)" },
            { opacity: 0, transform: "translateY(-10px)" },
          ],
          {
            duration: 200,
            delay: i * 12,
            easing: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
            fill: "both",
          },
        ),
      );

      const settled = Promise.allSettled(anims.map((a) => a.finished));
      const timeout = new Promise((resolve) => setTimeout(resolve, 800));
      void Promise.race([settled, timeout]).then(() => {
        navigatingRef.current = false;
        router.push(dest);
      });
    },
    [pathname, router, stripLocale],
  );

  useLayoutEffect(() => {
    if (firstPathRef.current) {
      firstPathRef.current = false;
      return;
    }
    const main = mainRef.current;
    if (!main) return;
    main.scrollTop = 0;
    const h1 = main.querySelector<HTMLElement>("h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
    if (process.env.NODE_ENV === "test") return;
    if (typeof main.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = Array.from(main.children).find(
      (el) => !el.classList.contains("wf-util-row"),
    ) as HTMLElement | undefined;
    // Dashboard drives its own entrance (char-split title, card CSS, WAAPI).
    if (!root || root.classList.contains("wf-view")) return;

    const kids = Array.from(root.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el.offsetParent !== null,
    );
    kids.forEach((el, i) => {
      const a = el.animate(
        [
          { opacity: 0, transform: "translateY(30px) scale(0.985)" },
          { opacity: 1, transform: "translateY(0px) scale(1)" },
        ],
        {
          duration: 800,
          delay: i * 60,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
          fill: "both",
        },
      );
      a.onfinish = () => a.cancel();
    });
  }, [pathname]);

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

  // g-then-letter chord shortcuts (g d/j/w/c/v/t/s/r). Ignores typing
  // contexts and modifier-held keys; the `g` primes a 900ms window.
  const gPrimedRef = useRef(0);
  const handleGChord = useCallback(
    (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;
      const key = event.key.toLowerCase();
      if (key === "g") {
        gPrimedRef.current = Date.now();
        return;
      }
      if (Date.now() - gPrimedRef.current < 900 && G_SHORTCUTS[key]) {
        event.preventDefault();
        gPrimedRef.current = 0;
        router.push(G_SHORTCUTS[key]);
      }
    },
    [router],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", handleGChord);
    return () => window.removeEventListener("keydown", handleGChord);
  }, [handleGChord]);

  // ── Sample micro-motion (ho / go / vo), delegated from the shell root ──
  // click pop: .btn/.chip/.icon-btn/.seg__btn svg scale .7→1 back.out(3);
  // magnetic: .magnetic follows the pointer (x*.22 y*.28, .5s power3.out);
  // lift: [data-lift] rises y-3 on hover. Fine-pointer only; test env and
  // reduced motion no-op (jsdom also lacks element.animate as a backstop).
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    const root = bootRootRef.current;
    if (!root || typeof root.addEventListener !== "function") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const out3 = "cubic-bezier(0.215, 0.61, 0.355, 1)";

    const pop = (el: Element) => {
      if (reduced() || typeof el.animate !== "function") return;
      const target = (el.querySelector("svg") || el) as Element;
      if (typeof target.animate !== "function") return;
      target.getAnimations().forEach((a) => a.cancel());
      const a = target.animate(
        [{ transform: "scale(0.7)" }, { transform: "scale(1)" }],
        {
          duration: 550,
          easing: "cubic-bezier(0.34, 2.2, 0.64, 1)",
          fill: "both",
        },
      );
      a.onfinish = () => a.cancel();
    };

    const onClick = (event: MouseEvent) => {
      const hit = (event.target as HTMLElement | null)?.closest?.(
        ".wf-btn, .wf-icon-btn, .wf-seg__btn, [data-toast]",
      );
      if (hit) pop(hit);
    };

    const attached = new WeakSet<Element>();
    const attach = (el: Element, kind: "magnetic" | "lift") => {
      if (attached.has(el) || !fine) return;
      attached.add(el);
      if (typeof (el as HTMLElement).animate !== "function") return;
      if (kind === "magnetic") {
        const node = el as HTMLElement;
        node.style.transition = `transform 0.5s ${out3}`;
        node.addEventListener("pointermove", (event: PointerEvent) => {
          if (reduced()) return;
          const rect = node.getBoundingClientRect();
          node.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.22}px, ${(event.clientY - rect.top - rect.height / 2) * 0.28}px)`;
        });
        node.addEventListener("pointerleave", () => {
          node.style.transform = "";
        });
        return;
      }
      const node = el as HTMLElement;
      node.addEventListener("pointerenter", () => {
        if (reduced()) return;
        node.getAnimations().forEach((a) => a.cancel());
        node.animate(
          [{ transform: "translateY(0px)" }, { transform: "translateY(-3px)" }],
          { duration: 450, easing: out3, fill: "both" },
        );
      });
      node.addEventListener("pointerleave", () => {
        node.getAnimations().forEach((a) => a.cancel());
        const a = node.animate(
          [{ transform: "translateY(-3px)" }, { transform: "translateY(0px)" }],
          { duration: 500, easing: out3, fill: "both" },
        );
        a.onfinish = () => a.cancel();
      });
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || typeof target.closest !== "function") return;
      const magnetic = target.closest(".magnetic");
      if (magnetic) attach(magnetic, "magnetic");
      const lift = target.closest("[data-lift]");
      if (lift) attach(lift, "lift");
    };

    root.addEventListener("click", onClick);
    root.addEventListener("pointerover", onOver);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("pointerover", onOver);
    };
  }, []);

  // Sample boot (ff): #app fade .6s power3.out → sidebar items x:-14
  // stagger .03 at +.1 → nav rail scaleY back.out(2) at +.5. Runs once per
  // full load (AdminShell stays mounted across routes); test/reduced-motion
  // keep the static end state (CSS default) and skip entirely.
  const bootRootRef = useRef<HTMLDivElement | null>(null);
  const bootRanRef = useRef(false);
  useLayoutEffect(() => {
    if (bootRanRef.current) return;
    bootRanRef.current = true;
    const root = bootRootRef.current;
    if (process.env.NODE_ENV === "test" || !root) return;
    if (typeof root.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const out3 = "cubic-bezier(0.215, 0.61, 0.355, 1)";
    const anims: Animation[] = [];

    anims.push(
      root.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 600,
        easing: out3,
        fill: "both",
      }),
    );

    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-boot]"),
    ).filter((el) => getComputedStyle(el).display !== "none");
    items.forEach((el, i) => {
      const a = el.animate(
        [
          { opacity: 0, transform: "translateX(-14px)" },
          { opacity: 1, transform: "translateX(0px)" },
        ],
        {
          duration: 550,
          delay: 100 + i * 30,
          easing: out3,
          fill: "both",
        },
      );
      a.onfinish = () => a.cancel();
      anims.push(a);
    });

    const pillEl = pillRef.current;
    if (pillEl) {
      // Preserve the measured translateY — only pop scaleY (sample Fd rail).
      const current = pillEl.style.transform || "";
      const from = current.includes("scaleY")
        ? current.replace(/scaleY\([^)]*\)/, "scaleY(0)")
        : `${current} scaleY(0)`.trim();
      const to = current.includes("scaleY")
        ? current.replace(/scaleY\([^)]*\)/, "scaleY(1)")
        : `${current} scaleY(1)`.trim();
      const a = pillEl.animate([{ transform: from }, { transform: to }], {
        duration: 550,
        delay: 500,
        easing: "cubic-bezier(0.34, 1.9, 0.64, 1)",
        fill: "both",
      });
      a.onfinish = () => {
        a.cancel();
        if (pillEl.style.transform) return;
        pillEl.style.transform = to;
      };
      anims.push(a);
    }

    return () => {
      anims.forEach((a) => {
        try {
          a.cancel();
        } catch {
          /* already finished/cancelled */
        }
      });
    };
  }, []);

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

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Operations: false,
    Governance: false,
  });

  const toggleGroup = useCallback((title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }, []);

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
      ref={bootRootRef}
      onClickCapture={handleExitCapture}
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
          data-boot
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
            {navGroups.map((group) => {
              const isMain = group.title === "Main";
              const isOpen = isMain || collapsed || Boolean(openGroups[group.title]);

              return (
                <div key={group.title}>
                  {isMain ? (
                    <p data-boot className="relative px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      data-boot
                      className="wf-nav-toggle relative flex w-full items-center justify-between px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-navy cursor-pointer select-none"
                    >
                      <span>{group.title}</span>
                      <ChevronDown
                        className={`size-3.5 transition-transform duration-200 ${
                          isOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>
                  )}
                  {isOpen ? (
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
                            data-boot
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
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Support Info */}
        <div className="wf-sidebar__foot">
          <div data-boot className="flex items-center gap-3 rounded-2xl border border-teal/15 bg-teal/5 p-3">
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
        <main ref={mainRef} className="wf-main flex-1 overflow-y-auto min-h-0">
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
