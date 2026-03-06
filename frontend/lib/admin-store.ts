"use client";

import { create } from "zustand";

import type { AdminDashboardSnapshot, FacebookPageCredential } from "@/lib/types";

type SidebarCounts = {
  publishedJobs: number;
  draftedJobs: number;
  pendingApprovals: number;
};

type AdminShellState = {
  sidebarCollapsed: boolean;
  sidebarCounts: SidebarCounts;
  facebookProfile: FacebookPageCredential | null;
  setSidebarCollapsed: (value: boolean | ((current: boolean) => boolean)) => void;
  setSidebarCounts: (counts: SidebarCounts) => void;
  setFacebookProfile: (profile: FacebookPageCredential | null) => void;
  hydrateFromSnapshot: (snapshot?: AdminDashboardSnapshot | null) => void;
};

function normalizeFacebookProfile(profile?: FacebookPageCredential | null) {
  if (!profile) return null;
  if (profile.profile_name || profile.account_name || profile.profile_image_url) {
    return profile;
  }
  return null;
}

export const useAdminShellStore = create<AdminShellState>((set) => ({
  sidebarCollapsed: false,
  sidebarCounts: {
    publishedJobs: 0,
    draftedJobs: 0,
    pendingApprovals: 0,
  },
  facebookProfile: null,
  setSidebarCollapsed: (value) =>
    set((state) => ({
      sidebarCollapsed:
        typeof value === "function" ? value(state.sidebarCollapsed) : value,
    })),
  setSidebarCounts: (counts) => set({ sidebarCounts: counts }),
  setFacebookProfile: (profile) =>
    set({
      facebookProfile: normalizeFacebookProfile(profile),
    }),
  hydrateFromSnapshot: (snapshot) =>
    set((state) => ({
      sidebarCounts: snapshot
        ? {
            publishedJobs: snapshot.published_jobs,
            draftedJobs: snapshot.draft_jobs,
            pendingApprovals: snapshot.pending_approvals.length,
          }
        : state.sidebarCounts,
    })),
}));
