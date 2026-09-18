"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  MessageSquare,
  User,
} from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { StatusBanner } from "./status-banner";
import { StatsOverview } from "./stats-overview";
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

export function WorkerDashboardShell() {
  const [profile, setProfile] = useState<WorkerDashboardProfile>(
    INITIAL_WORKER_PROFILE
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    INITIAL_NOTIFICATIONS
  );

  // Load any onboarding profile name/phone from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hunar_worker_onboarding");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) {
          setProfile((prev) => ({
            ...prev,
            fullName: parsed.fullName || prev.fullName,
            phone: parsed.phone || prev.phone,
            skills: parsed.skills?.length ? parsed.skills : prev.skills,
            serviceAreas: parsed.serviceAreas?.length ? parsed.serviceAreas : prev.serviceAreas,
            bio: parsed.bio || prev.bio,
            experienceYears: Number(parsed.experienceYears) || prev.experienceYears,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleOnline = () => {
    setProfile((prev) => ({
      ...prev,
      isOnline: !prev.isOnline,
    }));
  };

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen flex bg-white text-dark">
      {/* 1. Desktop Sidebar Navigation (§5.1 & Design Docs) */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profile={profile}
      />

      {/* 2. Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 pb-20 lg:pb-10">
        {/* Header (HUNAR logo, search bar, notifications bell with unread badge, profile avatar) */}
        <DashboardHeader
          profile={profile}
          notifications={notifications}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectTab={setActiveTab}
          onMarkNotificationsRead={handleMarkNotificationsRead}
        />

        {/* Main Inner Container */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
          {/* Status Banner (Online/Offline switch with -500 Rs rule) */}
          <StatusBanner
            isOnline={profile.isOnline}
            onToggleOnline={handleToggleOnline}
            city={profile.city}
            serviceAreas={profile.serviceAreas}
          />

          {/* Key Statistics Row (Active Jobs, Total Earnings, Customer Rating) */}
          <StatsOverview profile={profile} onSelectTab={setActiveTab} />

          {/* Tab Views Content Area */}
          <div className="pt-2">
            {activeTab === "dashboard" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal/10 text-teal mb-3">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-base font-bold text-navy">Nearby Jobs</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  Matching job requests in your service areas will appear here when you are Online.
                </p>
              </div>
            )}

            {activeTab === "jobs" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal/10 text-teal mb-3">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-base font-bold text-navy">Active Jobs</h3>
                <p className="mt-1 text-xs text-slate-500">
                  No active jobs in progress.
                </p>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal/10 text-teal mb-3">
                  <Wallet className="size-6" />
                </div>
                <h3 className="text-base font-bold text-navy">Earnings</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Earnings history and payout records.
                </p>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal/10 text-teal mb-3">
                  <MessageSquare className="size-6" />
                </div>
                <h3 className="text-base font-bold text-navy">Messages</h3>
                <p className="mt-1 text-xs text-slate-500">
                  No active messages.
                </p>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal/10 text-teal mb-3">
                  <User className="size-6" />
                </div>
                <h3 className="text-base font-bold text-navy">{profile.fullName}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {profile.phone} · {profile.city}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (on small screens) */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeJobsCount={profile.activeJobsCount}
      />
    </div>
  );
}
