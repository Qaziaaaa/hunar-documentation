"use client";

import { useState } from "react";
import { Briefcase, MessageSquare, Settings, Wallet } from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { JobRequestFeed } from "./job-request-feed";
import { RadarSearchView } from "./radar-search-view";
import { MobileNavBar } from "./mobile-nav-bar";
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
        };
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_WORKER_PROFILE;
}

export function WorkerDashboardShell() {
  const [profile, setProfile] = useState<WorkerDashboardProfile>(
    loadInitialProfile
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [viewMode, setViewMode] = useState<"feed" | "radar">("feed");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    INITIAL_NOTIFICATIONS
  );

  const handleToggleOnline = () => {
    setProfile((prev) => ({
      ...prev,
      isOnline: !prev.isOnline,
    }));
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const placeholderTabs: Record<string, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = {
    earnings: {
      title: "Earnings & Wallet",
      subtitle: "Track your escrow-secured earnings and wallet balance.",
      icon: Wallet,
    },
    chat: {
      title: "Messages",
      subtitle: "Customer conversations and visit confirmations will appear here.",
      icon: MessageSquare,
    },
    profile: {
      title: "Profile & Settings",
      subtitle: "Manage your verified pro profile, services and preferences.",
      icon: Settings,
    },
  };
  const placeholder = placeholderTabs[activeTab];

  const renderMainContent = () => {
    if (activeTab === "dashboard" || activeTab === "jobs") {
      return viewMode === "feed" ? (
        <JobRequestFeed
          searchQuery={searchQuery}
          city={profile.city}
          isOnline={profile.isOnline}
        />
      ) : (
        <RadarSearchView
          city={profile.city}
          workerName={profile.fullName.split(" ")[0]}
          onViewFeed={() => setViewMode("feed")}
        />
      );
    }

    const PlaceholderIcon = placeholder?.icon ?? Briefcase;
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-teal/15 bg-white p-8 text-center shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <PlaceholderIcon className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold tracking-tight text-navy">
          {placeholder?.title ?? "Section"}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {placeholder?.subtitle ?? "This section is coming soon."}
        </p>
        <span className="mt-5 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-orange">
          Coming Soon
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-20 md:pb-8">
      {/* Top Header */}
      <DashboardHeader
        profile={profile}
        notifications={notifications}
        searchQuery={searchQuery}
        isOnline={profile.isOnline}
        viewMode={viewMode}
        onToggleOnline={handleToggleOnline}
        onSearchChange={setSearchQuery}
        onSelectTab={setActiveTab}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onSelectViewMode={setViewMode}
      />

      {/* Sidebar + Main Content Area */}
      <div className="flex flex-1 items-stretch">
        <DashboardSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          profile={profile}
          unreadNotificationsCount={unreadNotificationsCount}
        />

        <main className="flex-1 px-2.5 sm:px-4 py-3 sm:py-4">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeJobsCount={profile.activeJobsCount}
      />
    </div>
  );
}
