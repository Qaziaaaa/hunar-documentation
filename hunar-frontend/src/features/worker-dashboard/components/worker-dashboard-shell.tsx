"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Briefcase } from "lucide-react";
import { http } from "@/lib/api-client";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { JobRequestFeed } from "./job-request-feed";
import { MobileNavBar } from "./mobile-nav-bar";
import { WorkerJobsHub } from "@/features/jobs/components/worker-jobs-hub";
import { WorkerEarningsContent } from "@/app/[locale]/(worker)/worker/earnings/page";
import { WalletContent } from "@/app/[locale]/(worker)/worker/wallet/page";
import {
  INITIAL_WORKER_PROFILE,
  INITIAL_NOTIFICATIONS,
} from "../mock-data";
import type {
  DashboardTab,
  WorkerDashboardProfile,
  DashboardNotification,
} from "../types";

function loadInitialProfile(): WorkerDashboardProfile {
  if (typeof window === "undefined") return INITIAL_WORKER_PROFILE;
  try {
    const saved = window.localStorage.getItem("hunar_worker_onboarding");
    const savedOnline = window.localStorage.getItem("hunar_worker_online");
    const isOnline = savedOnline !== null ? savedOnline === "true" : INITIAL_WORKER_PROFILE.isOnline;

    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.fullName) {
        return {
          ...INITIAL_WORKER_PROFILE,
          fullName: parsed.fullName || INITIAL_WORKER_PROFILE.fullName,
          phone: parsed.phone || INITIAL_WORKER_PROFILE.phone,
          skills: parsed.skills?.length ? parsed.skills : INITIAL_WORKER_PROFILE.skills,
          serviceAreas: parsed.serviceAreas?.length ? parsed.serviceAreas : INITIAL_WORKER_PROFILE.serviceAreas,
          bio: parsed.bio || INITIAL_WORKER_PROFILE.bio,
          experienceYears: Number(parsed.experienceYears) || INITIAL_WORKER_PROFILE.experienceYears,
          isOnline,
        };
      }
    }
    return {
      ...INITIAL_WORKER_PROFILE,
      isOnline,
    };
  } catch {
    // ignore
  }
  return INITIAL_WORKER_PROFILE;
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

  const [profile, setProfile] = useState<WorkerDashboardProfile>(
    INITIAL_WORKER_PROFILE
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    INITIAL_NOTIFICATIONS
  );

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync profile & online status from client localStorage on mount to prevent hydration mismatch
  useEffect(() => {
    setProfile(loadInitialProfile());
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

  // Sync profile & online status from live backend on mount
  useEffect(() => {
    async function syncBackendProfile() {
      try {
        const raw = await http.get<any>("/users/worker/me");
        const data = raw?.data ?? raw;
        if (data?.user) {
          const wp = data.workerProfile;
          const areas = data.serviceAreas?.map((a: any) => a.label) || [];
          setProfile((prev) => ({
            ...prev,
            id: data.user.id || prev.id,
            workerId: data.user.id ? `WRK-${data.user.id.slice(0, 8).toUpperCase()}` : prev.workerId,
            fullName: data.user.name || prev.fullName,
            phone: data.user.phone || prev.phone,
            avatarUrl: data.user.avatarUrl || prev.avatarUrl,
            skills: wp?.skills?.length ? wp.skills : prev.skills,
            serviceAreas: areas.length ? areas : prev.serviceAreas,
            bio: wp?.bio || prev.bio,
            experienceYears: Number(wp?.experienceYears) || prev.experienceYears,
            isOnline: wp?.isAvailable ?? prev.isOnline,
            isVerified: wp?.verificationStatus === "APPROVED",
          }));
        }
      } catch (err) {
        console.warn("[WorkerDashboardShell] Syncing live profile:", err);
      }
    }
    syncBackendProfile();
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
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const renderMainContent = () => {
    if (children) {
      return <div className="space-y-4 max-w-7xl mx-auto w-full">{children}</div>;
    }

    if (activeTab === "dashboard") {
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
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeJobsCount={profile.activeJobsCount}
      />
    </div>
  );
}
