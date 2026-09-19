"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "./dashboard-header";
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

export function WorkerDashboardShell() {
  const [profile, setProfile] = useState<WorkerDashboardProfile>(
    INITIAL_WORKER_PROFILE
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [viewMode, setViewMode] = useState<"feed" | "radar">("feed");
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
    <div className="min-h-screen flex flex-col bg-white text-dark pb-20 md:pb-8">
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

      {/* Main Content Area - Job Requests Feed or Radar Searching View */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-2.5 sm:px-4 py-3 sm:py-4">
        {viewMode === "feed" ? (
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
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeJobsCount={profile.activeJobsCount}
      />
    </div>
  );
}
