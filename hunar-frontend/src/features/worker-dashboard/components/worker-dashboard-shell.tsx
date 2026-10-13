"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Briefcase } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { http, getAccessToken, getStoredUser, clearTokens } from "@/lib/api-client";
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
import { getWorkerEarnings } from "@/services/worker/earnings.service";
import { listWorkerJobs } from "@/services/worker/jobs.service";
import { isUpcomingRawStatus } from "@/stores/worker-jobs-adapter";
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

  const [profile, setProfile] = useState<WorkerDashboardProfile>(EMPTY_WORKER_PROFILE);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasCachedProfile, setHasCachedProfile] = useState<boolean>(false);
  const [upcomingJobsCount, setUpcomingJobsCount] = useState<number>(0);

  // Sync profile & online status from client localStorage on mount to prevent hydration mismatch
  useEffect(() => {
    const initial = loadInitialProfile();
    setProfile(initial.profile);
    setHasCachedProfile(initial.isLoaded);
    setIsLoadingProfile(!initial.isLoaded);
  }, []);

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
    } else if (pathname.includes("/worker/dashboard") || pathname.endsWith("/worker")) {
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
    }
  };

  // Enforce worker role and token authentication on worker routes
  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();
    if (!token) {
      router.push("/worker/sign-in");
      return;
    }
    if (user && user.role !== "WORKER") {
      router.push("/worker/sign-in");
      return;
    }
  }, [router]);

  // Sync profile & online status from live backend
  const syncBackendProfile = useCallback(async () => {
    if (!getAccessToken()) return;
    setSyncError(null);
    try {
      const [profileRes, earningsRes, jobsRes] = await Promise.allSettled([
        http.get<any>("/users/worker/me"),
        getWorkerEarnings(),
        listWorkerJobs(),
      ]);

      const rejection = [profileRes, earningsRes, jobsRes].find(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult | undefined;
      if (rejection) {
        const reason = rejection.reason;
        setSyncError(
          reason instanceof Error && reason.message
            ? reason.message
            : "Could not refresh your data. Please try again."
        );
      }

      const raw = profileRes.status === "fulfilled" ? profileRes.value : null;
      const earningsData =
        earningsRes.status === "fulfilled" ? earningsRes.value : null;
      const myActiveJobs = jobsRes.status === "fulfilled" ? jobsRes.value : [];
      const data = raw?.data ?? raw;
      const liveActiveJobs = Array.isArray(myActiveJobs) ? myActiveJobs.length : undefined;
      const liveUpcomingJobs = Array.isArray(myActiveJobs)
        ? myActiveJobs.filter((j) => isUpcomingRawStatus(j.status)).length
        : undefined;
      if (liveUpcomingJobs !== undefined) {
        setUpcomingJobsCount(liveUpcomingJobs);
      }

        if (data?.user) {
          const wp = data.workerProfile;
          const areas = data.serviceAreas?.map((a: any) => a.label) || [];
          const liveSkills =
            wp?.skillCategories
              ?.map((c: { name?: string }) => c.name)
              .filter(Boolean) ??
              (wp?.skills?.length ? wp.skills : []);

          const liveRating =
            typeof data.rating === "number"
              ? data.rating
              : typeof wp?.rating === "number"
              ? wp.rating
              : undefined;

          const liveCompletedJobs =
            typeof data.completedJobs === "number"
              ? data.completedJobs
              : earningsData?.completedJobsCount;

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
              totalEarnings: earningsData?.grossEarnings ?? prev.totalEarnings,
              completedJobsCount: liveCompletedJobs !== undefined ? liveCompletedJobs : prev.completedJobsCount,
              totalCommissionPaid: earningsData?.commissionsPaid ?? prev.totalCommissionPaid,
              walletBalance: earningsData?.balance ?? prev.walletBalance,
            };

            try {
              if (data.user.id) {
                window.localStorage.setItem(getWorkerProfileCacheKey(data.user.id), JSON.stringify(nextProfile));
              }
              window.localStorage.setItem(WORKER_PROFILE_CACHE_KEY, JSON.stringify(nextProfile));
            } catch {}

            return nextProfile;
          });
        } else if (earningsData || liveActiveJobs !== undefined) {
          setProfile((prev) => {
            const nextProfile: WorkerDashboardProfile = {
              ...prev,
              activeJobsCount: liveActiveJobs !== undefined ? liveActiveJobs : prev.activeJobsCount,
              totalEarnings: earningsData?.grossEarnings ?? prev.totalEarnings,
              completedJobsCount: earningsData?.completedJobsCount ?? prev.completedJobsCount,
              totalCommissionPaid: earningsData?.commissionsPaid ?? prev.totalCommissionPaid,
              walletBalance: earningsData?.balance ?? prev.walletBalance,
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
      console.warn("[WorkerDashboardShell] Syncing live profile:", err);
      setSyncError(
        err instanceof Error && err.message
          ? err.message
          : "Could not refresh your data. Please try again."
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void syncBackendProfile();
    }, 0);
    return () => window.clearTimeout(id);
  }, [syncBackendProfile]);

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
      router.push("/worker/sign-in");
    }
  };

  // Open the realtime socket (job matched / offer events) when running against the API
  useEffect(() => {
    if (!getAccessToken()) return;
    connectSocket();
    return () => disconnectSocket();
  }, []);

  // Load real notifications and keep them live over the socket
  useEffect(() => {
    if (!getAccessToken()) return;
    let cancelled = false;
    getNotifications()
      .then((list) => {
        if (!cancelled) setNotifications(list.map(mapAppNotification));
      })
      .catch((err) => {
        console.warn("[WorkerDashboardShell] Loading notifications:", err);
      });
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
  }, []);

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
              onRetry={() => void syncBackendProfile()}
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 pb-20 md:pb-8">
      {/* Full-Height Fixed Desktop Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        profile={profile}
        unreadNotificationsCount={unreadNotificationsCount}
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
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-white px-3 sm:px-6 py-4 sm:py-6">
          {syncError && hasCachedProfile && (
            <div className="mb-4 max-w-7xl mx-auto w-full rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3">
              <span>
                <strong>
                  {activeTab === "dashboard"
                    ? "Showing saved data."
                    : "Could not refresh your data."}
                </strong>{" "}
                {syncError}
              </span>
              <button
                type="button"
                onClick={() => void syncBackendProfile()}
                className="shrink-0 font-bold text-[#0F8B8D] hover:underline cursor-pointer"
              >
                Retry
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
