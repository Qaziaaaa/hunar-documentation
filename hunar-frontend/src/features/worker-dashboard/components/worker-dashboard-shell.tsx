"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Briefcase, WifiOff } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { http, getAccessToken, getStoredUser, clearTokens, getRefreshToken } from "@/lib/api-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { timeAgo } from "@/lib/format";
import { logoutWorker } from "@/features/auth/api/auth-api";
import {
  getNotifications,
  markAllNotificationsRead,
  subscribeToNotifications,
} from "@/services/worker/notification.service";
import type { AppNotification } from "@/types/notification";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNavBar } from "./mobile-nav-bar";
import { JobRequestFeed } from "./job-request-feed";
import dynamic from "next/dynamic";

const WorkerJobsHub = dynamic(
  () => import("@/features/jobs/components/worker-jobs-hub").then((m) => m.WorkerJobsHub),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-slate-50 border border-slate-200/60 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
        Loading jobs...
      </div>
    ),
  }
);
const WorkerEarningsContent = dynamic(
  () =>
    import("@/app/[locale]/(worker)/worker/earnings/page").then(
      (m) => m.WorkerEarningsContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-slate-50 border border-slate-200/60 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
        Loading earnings...
      </div>
    ),
  }
);
const WalletContent = dynamic(
  () =>
    import("@/app/[locale]/(worker)/worker/wallet/page").then(
      (m) => m.WalletContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-slate-50 border border-slate-200/60 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 text-xs font-semibold">
        Loading wallet...
      </div>
    ),
  }
);
import { listWorkerJobs } from "@/services/worker/jobs.service";
import { getWorkerEarnings } from "@/services/worker/earnings.service";
import { isUpcomingRawStatus } from "@/stores/worker-jobs-adapter";
import { workerStore } from "@/stores/worker-jobs-store";
import type {
  DashboardTab,
  WorkerDashboardProfile,
  DashboardNotification,
} from "../types";

export function getWorkerProfileCacheKey(userId?: string): string {
  return userId ? `workerfix.worker_profile_${userId}` : "workerfix.worker_profile_cache";
}

export const WORKER_PROFILE_CACHE_KEY = "workerfix.worker_profile_cache";

const EMPTY_WORKER_PROFILE: WorkerDashboardProfile = {
  id: "",
  workerId: "",
  fullName: "",
  phone: "",
  isVerified: false,
  isOnline: true,
  rating: 0,
  reviewCount: 0,
  activeJobsCount: 0,
  completedJobsCount: 0,
  totalEarnings: 0,
  totalCommissionPaid: 0,
  pendingCommission: 0,
  walletBalance: 0,
  experienceYears: 0,
  bio: "",
  skills: [],
  serviceAreas: [],
  city: "",
};

function loadInitialProfile(): { profile: WorkerDashboardProfile; isLoaded: boolean } {
  if (typeof window === "undefined") {
    return {
      profile: EMPTY_WORKER_PROFILE,
      isLoaded: false,
    };
  }
  try {
    const storedUser = getStoredUser();
    const targetUserId = storedUser?.id;

    // 1. Try to load user-scoped cached live profile
    if (targetUserId) {
      const userCached = window.localStorage.getItem(getWorkerProfileCacheKey(targetUserId));
      if (userCached) {
        const parsed = JSON.parse(userCached);
        if (parsed && (parsed.fullName || parsed.id)) {
          return { profile: parsed, isLoaded: true };
        }
      }
    }

    // 2. Check if legacy / global cache matches targetUserId
    const legacyCached = window.localStorage.getItem(WORKER_PROFILE_CACHE_KEY);
    if (legacyCached) {
      const parsed = JSON.parse(legacyCached);
      if (parsed && (!targetUserId || parsed.id === targetUserId) && parsed.fullName) {
        return { profile: parsed, isLoaded: true };
      }
    }

    const savedOnboarding = window.localStorage.getItem("hunar_worker_onboarding");
    const savedOnline = window.localStorage.getItem("hunar_worker_online");
    const isOnline = savedOnline !== null ? savedOnline === "true" : true;

    let parsedOnboarding: any = {};
    if (savedOnboarding) {
      try {
        parsedOnboarding = JSON.parse(savedOnboarding);
      } catch {}
    }

    if (storedUser) {
      const hasName = Boolean(storedUser.name || parsedOnboarding.fullName);
      return {
        profile: {
          ...EMPTY_WORKER_PROFILE,
          id: storedUser.id,
          workerId: `WRK-${storedUser.id.slice(0, 8).toUpperCase()}`,
          fullName: storedUser.name || parsedOnboarding.fullName || "",
          phone: storedUser.phone || parsedOnboarding.phone || "",
          isVerified: storedUser.isVerified ?? false,
          skills: parsedOnboarding.skills || [],
          serviceAreas: parsedOnboarding.serviceAreas || [],
          bio: parsedOnboarding.bio || "",
          experienceYears: Number(parsedOnboarding.experienceYears) || 0,
          isOnline,
        },
        // If we don't have a verified name or stats yet, consider it still needing live sync
        isLoaded: hasName,
      };
    }
  } catch {
    // ignore
  }

  return {
    profile: EMPTY_WORKER_PROFILE,
    isLoaded: false,
  };
}

const NOTIF_TYPE_MAP: Record<AppNotification["type"], DashboardNotification["type"]> = {
  new_job: "job",
  visit_approaching: "job",
  offer_accepted: "offer",
  offer_rejected: "offer",
  counter_offer: "offer",
  counter_accepted: "offer",
  commission_reminder: "commission",
  commission_verified: "commission",
  earnings_recorded: "commission",
  new_review: "review",
  new_message: "chat",
  verification_result: "verification",
  new_offer: "offer",
  visit_scheduled: "job",
  inspection_submitted: "job",
  repair_estimate_ready: "offer",
  repair_approved: "offer",
  payment_confirmed: "commission",
  job_completed: "job",
  job_expired_no_worker: "job",
  job_cancelled: "job",
};

function mapAppNotification(n: AppNotification): DashboardNotification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    time: timeAgo(n.createdAt),
    read: n.read,
    type: NOTIF_TYPE_MAP[n.type] ?? "job",
  };
}

export function WorkerDashboardShell({
  initialTab = "dashboard",
  children,
}: {
  initialTab?: DashboardTab;
  children?: React.ReactNode;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<WorkerDashboardProfile>(EMPTY_WORKER_PROFILE);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasCachedProfile, setHasCachedProfile] = useState<boolean>(false);
  const [upcomingJobsCount, setUpcomingJobsCount] = useState<number>(0);

  const SHOW_RELEVANT_JOBS_KEY = "workerfix_show_relevant_jobs";
  const [showRelevantJobs, setShowRelevantJobs] = useState<boolean>(false);

  // Enforce worker role and token authentication on worker routes
  useEffect(() => {
    const token = getAccessToken("WORKER") || getRefreshToken("WORKER");
    const user = getStoredUser("WORKER");
    if (!token) {
      router.replace("/worker/sign-in");
      return;
    }
    if (user && user.role !== "WORKER") {
      router.replace("/worker/sign-in");
      return;
    }
    setSessionReady(true);
  }, [router]);

  // Sync profile & online status from client localStorage on mount once session is confirmed
  useEffect(() => {
    if (!sessionReady) return;

    const initial = loadInitialProfile();
    setProfile(initial.profile);
    setHasCachedProfile(initial.isLoaded);
    setIsLoadingProfile(!initial.isLoaded);

    try {
      const storedUser = getStoredUser();
      const userKey = storedUser?.id ? `${SHOW_RELEVANT_JOBS_KEY}_${storedUser.id}` : null;
      const savedUser = userKey ? window.localStorage.getItem(userKey) : null;
      const savedGlobal = window.localStorage.getItem(SHOW_RELEVANT_JOBS_KEY);
      const val = savedUser ?? savedGlobal;
      if (val !== null) {
        setShowRelevantJobs(val === "true");
      }
    } catch {}
  }, [sessionReady]);

  const handleToggleShowRelevantJobs = (enabled?: boolean) => {
    setShowRelevantJobs((prev) => {
      const next = typeof enabled === "boolean" ? enabled : !prev;
      try {
        const storedUser = getStoredUser();
        if (storedUser?.id) {
          window.localStorage.setItem(`${SHOW_RELEVANT_JOBS_KEY}_${storedUser.id}`, String(next));
        }
        window.localStorage.setItem(SHOW_RELEVANT_JOBS_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Synchronize activeTab with URL pathname
  useEffect(() => {
    if (pathname.includes("/worker/jobs")) {
      setActiveTab("jobs");
    } else if (pathname.includes("/worker/wallet")) {
      setActiveTab("wallet");
    } else if (pathname.includes("/worker/earnings")) {
      setActiveTab("earnings");
    } else if (pathname.includes("/worker/profile")) {
      setActiveTab("profile");
    } else if (pathname.includes("/worker/reviews")) {
      setActiveTab("reviews");
    } else if (pathname.includes("/worker/settings")) {
      setActiveTab("settings");
    } else if (pathname.includes("/worker/dashboard") || pathname.endsWith("/worker") || pathname.endsWith("/worker/")) {
      setActiveTab("dashboard");
    }
  }, [pathname]);

  const handleSelectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
    if (tab === "dashboard") {
      router.push("/worker");
    } else if (tab === "jobs") {
      router.push("/worker/jobs");
    } else if (tab === "wallet") {
      router.push("/worker/wallet");
    } else if (tab === "earnings") {
      router.push("/worker/earnings");
    } else if (tab === "profile") {
      router.push("/worker/profile");
    } else if (tab === "reviews") {
      router.push("/worker/reviews");
    } else if (tab === "settings") {
      router.push("/worker/settings");
    }
  };

  // Sync profile & online status from live backend (fast: only profile & active jobs)
  const syncBackendProfile = useCallback(async (isRetry: boolean = false) => {
    if (!getAccessToken("WORKER") && !getRefreshToken("WORKER")) return;
    if (isRetry) {
      setSyncError(null);
    }
    try {
      const [profileRes, jobsRes, earningsRes] = await Promise.allSettled([
        http.get<any>("/users/worker/me"),
        listWorkerJobs(),
        getWorkerEarnings(),
      ]);

      const rejection = [profileRes, jobsRes, earningsRes].find(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult | undefined;
      if (rejection) {
        if (!isRetry) {
          // Grace period: transient network hiccup on cold refresh. Retry silently once after 1.5s before surfacing error banner.
          window.setTimeout(() => {
            void syncBackendProfile(true);
          }, 1500);
        } else {
          const reason = rejection.reason;
          setSyncError(
            reason instanceof Error && reason.message
              ? reason.message
              : "Unstable internet connection. Some updates might be delayed."
          );
        }
      } else {
        setSyncError(null);
      }

      const raw = profileRes.status === "fulfilled" ? profileRes.value : null;
      const myActiveJobs = jobsRes.status === "fulfilled" ? jobsRes.value : [];
      const rawEarnings = earningsRes.status === "fulfilled" ? earningsRes.value : null;
      const data = raw?.data ?? raw;
      const liveActiveJobs = Array.isArray(myActiveJobs) ? myActiveJobs.length : undefined;
      const liveUpcomingJobs = Array.isArray(myActiveJobs)
        ? myActiveJobs.filter((j) => isUpcomingRawStatus(j.status)).length
        : undefined;
      if (liveUpcomingJobs !== undefined) {
        setUpcomingJobsCount(liveUpcomingJobs);
      }

      const liveNetEarnings = rawEarnings != null ? Number(rawEarnings.netEarnings ?? rawEarnings.grossEarnings ?? 0) : undefined;
      const liveWalletBalance = rawEarnings != null ? Number(rawEarnings.balance ?? 0) : undefined;
      const liveCommissionPaid = rawEarnings != null ? Number(rawEarnings.commissionsPaid ?? 0) : undefined;
      const liveCompletedFromEarnings = rawEarnings != null && typeof rawEarnings.completedJobsCount === "number" ? rawEarnings.completedJobsCount : undefined;

      if (liveWalletBalance !== undefined) {
        workerStore.setWalletBalance(liveWalletBalance);
      }

        if (data?.user) {
          const wp = data.workerProfile;
          const vStatus = wp?.verificationStatus;
          const isComplete = data.progress?.complete;

          // Guard against un-onboarded or un-verified workers accessing worker dashboard/jobs/wallet
          // 1. If worker is already APPROVED, grant direct access to dashboard (never redirect back to onboarding)
          if (vStatus !== "APPROVED") {
            // 2. Un-submitted or incomplete onboarding belongs on wizard
            if (!wp || vStatus === "NOT_SUBMITTED" || isComplete === false) {
              router.replace("/worker/onboarding");
              return;
            }

            // 3. Submitted and waiting for verification (PENDING, REJECTED, CHANGES_REQUESTED)
            router.replace("/worker/verification-status");
            return;
          }

          const areas = data.serviceAreas?.map((a: any) => a.label) || [];
          const skillCategoryNames = (wp?.skillCategories ?? [])
            .map((c: { name?: string }) => c.name)
            .filter(Boolean);
          const skillCategoryIds = (wp?.skillCategories ?? [])
            .map((c: { id?: string }) => c.id)
            .filter(Boolean);
          const rawSkills = Array.isArray(wp?.skills) ? wp.skills : [];
          const liveSkills = Array.from(
            new Set([...skillCategoryNames, ...skillCategoryIds, ...rawSkills])
          );

          const liveRating =
            typeof data.rating === "number"
              ? data.rating
              : typeof wp?.rating === "number"
              ? wp.rating
              : undefined;

          const liveCompletedJobs =
            typeof data.completedJobs === "number"
              ? data.completedJobs
              : undefined;

          setProfile((prev) => {
            const nextProfile: WorkerDashboardProfile = {
              ...prev,
              id: data.user.id || prev.id,
              workerId: data.user.id ? `WRK-${data.user.id.slice(0, 8).toUpperCase()}` : prev.workerId,
              fullName: data.user.name || prev.fullName,
              phone: data.user.phone || prev.phone,
              avatarUrl: data.user.avatarUrl || prev.avatarUrl,
              skills: liveSkills.length ? liveSkills : prev.skills,
              serviceAreas: areas.length ? areas : prev.serviceAreas,
              bio: wp?.bio || prev.bio,
              experienceYears: Number(wp?.experienceYears) || prev.experienceYears,
              isOnline: wp?.isAvailable ?? prev.isOnline,
              isVerified: wp?.verificationStatus === "APPROVED",
              rating: liveRating !== undefined ? liveRating : (prev.rating ?? 0),
              reviewCount: typeof data.reviewsCount === "number" ? data.reviewsCount : prev.reviewCount,
              activeJobsCount: liveActiveJobs !== undefined ? liveActiveJobs : prev.activeJobsCount,
              totalEarnings: liveNetEarnings !== undefined ? liveNetEarnings : prev.totalEarnings,
              completedJobsCount: liveCompletedJobs !== undefined ? liveCompletedJobs : (liveCompletedFromEarnings !== undefined ? liveCompletedFromEarnings : prev.completedJobsCount),
              totalCommissionPaid: liveCommissionPaid !== undefined ? liveCommissionPaid : prev.totalCommissionPaid,
              walletBalance: liveWalletBalance !== undefined ? liveWalletBalance : prev.walletBalance,
            };

            try {
              if (data.user.id) {
                window.localStorage.setItem(getWorkerProfileCacheKey(data.user.id), JSON.stringify(nextProfile));
              }
              window.localStorage.setItem(WORKER_PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
            } catch {}

            return nextProfile;
          });
        } else if (liveActiveJobs !== undefined) {
          setProfile((prev) => {
            const nextProfile: WorkerDashboardProfile = {
              ...prev,
              activeJobsCount: liveActiveJobs !== undefined ? liveActiveJobs : prev.activeJobsCount,
            };

            try {
              if (prev.id) {
                window.localStorage.setItem(getWorkerProfileCacheKey(prev.id), JSON.stringify(nextProfile));
              }
              window.localStorage.setItem(WORKER_PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
            } catch {}

            return nextProfile;
          });
        }
    } catch (err) {
      if (!isRetry) {
        window.setTimeout(() => {
          void syncBackendProfile(true);
        }, 1500);
      } else {
        console.warn("[WorkerDashboardShell] Syncing live profile:", err);
        setSyncError(
          err instanceof Error && err.message
            ? err.message
            : "Unstable internet connection. Some updates might be delayed."
        );
      }
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    const id = window.setTimeout(() => {
      void syncBackendProfile();
      void workerStore.hydrate();
    }, 0);
    return () => window.clearTimeout(id);
  }, [sessionReady, syncBackendProfile]);

  const handleLogout = async () => {
    try {
      await logoutWorker();
    } finally {
      clearTokens();
      try {
        if (profile.id) {
          window.localStorage.removeItem(getWorkerProfileCacheKey(profile.id));
        }
        window.localStorage.removeItem(WORKER_PROFILE_CACHE_KEY);
      } catch {}
      disconnectSocket(true);
      router.replace("/worker/sign-in");
    }
  };

  // Open the realtime socket (job matched / offer events) when running against the API
  useEffect(() => {
    if (!sessionReady) return;
    if (!getAccessToken("WORKER")) return;
    connectSocket();
    return () => disconnectSocket();
  }, [sessionReady]);

  // Load real notifications and keep them live over the socket
  useEffect(() => {
    if (!sessionReady) return;
    if (!getAccessToken("WORKER")) return;
    let cancelled = false;
    const fetchInbox = (retries = 1) => {
      getNotifications()
        .then((list) => {
          if (!cancelled) setNotifications(list.map(mapAppNotification));
        })
        .catch((err) => {
          if (retries > 0 && !cancelled) {
            setTimeout(() => {
              if (!cancelled) fetchInbox(retries - 1);
            }, 3000);
            return;
          }
          console.warn("[WorkerDashboardShell] Loading notifications:", err);
        });
    };
    fetchInbox();
    const unsubscribe = subscribeToNotifications((notification) => {
      setNotifications((prev) => [
        mapAppNotification(notification as AppNotification),
        ...prev.filter((n) => n.id !== (notification as AppNotification).id),
      ]);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sessionReady]);

  const handleToggleOnline = (targetStatus?: boolean) => {
    setProfile((prev) => {
      const nextStatus = typeof targetStatus === "boolean" ? targetStatus : !prev.isOnline;

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("hunar_worker_online", String(nextStatus));
        } catch {
          // ignore
        }
      }

      // Sync with server in background without breaking UI
      http.put("/users/worker/availability", { isAvailable: nextStatus }).catch((err) => {
        console.warn("[handleToggleOnline] Server sync notice:", err);
      });

      return {
        ...prev,
        isOnline: nextStatus,
      };
    });
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead().catch((err) => {
      console.warn("[WorkerDashboardShell] Marking notifications read:", err);
    });
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const renderMainContent = () => {
    if (children) {
      return <div className="space-y-4 max-w-7xl mx-auto w-full">{children}</div>;
    }

    if (activeTab === "dashboard") {
      if (syncError && !hasCachedProfile) {
        return (
          <div className="max-w-7xl mx-auto w-full">
            <ErrorState
              title="Unable to load your dashboard"
              description={syncError}
              onRetry={() => void syncBackendProfile(true)}
            />
          </div>
        );
      }
      return (
        <div className="space-y-4 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
          <JobRequestFeed
            searchQuery={searchQuery}
            city={profile.city}
            isOnline={profile.isOnline}
            workerSkills={profile.skills}
            showRelevantJobs={showRelevantJobs}
          />
        </div>
      );
    }

    if (activeTab === "jobs") {
      return <WorkerJobsHub />;
    }

    if (activeTab === "earnings") {
      return <WorkerEarningsContent />;
    }

    if (activeTab === "wallet") {
      return <WalletContent />;
    }

    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-teal/15 bg-white p-8 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <Briefcase className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold tracking-tight text-navy">
          Worker Portal Section
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          Select a tab from the sidebar navigation.
        </p>
      </div>
    );
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <LoadingState
          label={
            locale === "ur"
              ? "ورکر سیشن کی تصدیق کی جا رہی ہے..."
              : "Verifying worker session..."
          }
        />
      </div>
    );
  }

  return (
    <div
      data-portal="worker"
      className="min-h-screen flex flex-col bg-white text-slate-900 pb-20 md:pb-8 scrollbar-none no-scrollbar"
    >
      {/* Full-Height Fixed Desktop Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        profile={profile}
        unreadNotificationsCount={unreadNotificationsCount}
        upcomingJobsCount={upcomingJobsCount}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        onLogout={handleLogout}
        isLoadingProfile={isLoadingProfile}
      />

      {/* Main Container offset by lg:ps-64 on desktop */}
      <div className="flex-1 lg:ps-64 flex flex-col min-w-0 bg-white">
        {/* Top Header */}
        <DashboardHeader
          profile={profile}
          notifications={notifications}
          searchQuery={searchQuery}
          isOnline={profile.isOnline}
          onToggleOnline={handleToggleOnline}
          onSearchChange={setSearchQuery}
          onSelectTab={handleSelectTab}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          showRelevantJobs={showRelevantJobs}
          onToggleShowRelevantJobs={handleToggleShowRelevantJobs}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-white px-3 sm:px-6 py-4 sm:py-6">
          {syncError && hasCachedProfile && (
            <div className="mb-4 max-w-7xl mx-auto w-full rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
              <span className="flex items-center gap-2">
                <WifiOff className="size-4 shrink-0 text-amber-700" />
                <span>
                  <strong>
                    {locale === "ur"
                      ? "انٹرنیٹ کنکشن غیر مستحکم ہے۔"
                      : "Unstable internet connection."}
                  </strong>{" "}
                  {locale === "ur"
                    ? "ایپ میں سستی محسوس ہو سکتی ہے اور کچھ اپ ڈیٹس میں تاخیر ہو سکتی ہے۔"
                    : "The app might feel slow and some updates might be delayed."}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void syncBackendProfile(true)}
                className="shrink-0 font-bold text-[#0F8B8D] hover:underline cursor-pointer"
              >
                {locale === "ur" ? "دوبارہ کوشش کریں" : "Retry"}
              </button>
            </div>
          )}
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        upcomingJobsCount={upcomingJobsCount}
      />
    </div>
  );
}
