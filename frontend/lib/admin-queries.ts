"use client";

import { useQuery } from "@tanstack/react-query";

import { adminQueryKeys } from "@/lib/admin-query-keys";
import type {
  AdminDashboardSnapshot,
  AdminNotification,
  FacebookPageCredential,
  Job,
  JobsResponse,
} from "@/lib/types";

async function fetchAdminJson<T>(url: string, fallbackMessage: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = (await response.text()).trim();
    throw new Error(detail || fallbackMessage);
  }

  return (await response.json()) as T;
}

export function useAdminDashboardQuery(initialData?: AdminDashboardSnapshot) {
  return useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: () =>
      fetchAdminJson<AdminDashboardSnapshot>(
        "/api/admin/proxy/jobs/admin/dashboard",
        "Unable to load dashboard snapshot.",
      ),
    initialData,
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminJobsQuery(initialData: Job[]) {
  return useQuery({
    queryKey: adminQueryKeys.jobs,
    queryFn: async () => {
      const data = await fetchAdminJson<JobsResponse>(
        "/api/admin/proxy/jobs?include_inactive=1",
        "Unable to load jobs.",
      );
      return data.results;
    },
    initialData,
    staleTime: 5_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminNotificationsQuery(initialData: AdminNotification[] = []) {
  return useQuery({
    queryKey: adminQueryKeys.notifications,
    queryFn: async () => {
      const data = await fetchAdminJson<{ results: AdminNotification[] }>(
        "/api/admin/proxy/jobs/admin/notifications",
        "Unable to load notifications.",
      );
      return data.results;
    },
    initialData,
    staleTime: 5_000,
    refetchInterval: 30_000,
  });
}

export function useFacebookCredentialQuery(initialData?: FacebookPageCredential | null) {
  return useQuery({
    queryKey: adminQueryKeys.facebookCredential,
    queryFn: () =>
      fetchAdminJson<FacebookPageCredential>(
        "/api/admin/proxy/jobs/admin/channels/facebook",
        "Unable to load Facebook page connection.",
      ),
    initialData,
    staleTime: 15_000,
  });
}
