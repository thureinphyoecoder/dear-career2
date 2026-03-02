"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { useAdminShellStore } from "@/lib/admin-store";
import type { AdminDashboardSnapshot, FacebookPageCredential } from "@/lib/types";

export function AdminClientProvider({
  children,
  initialDashboardSnapshot,
  initialFacebookProfile,
}: {
  children: ReactNode;
  initialDashboardSnapshot?: AdminDashboardSnapshot;
  initialFacebookProfile?: FacebookPageCredential | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const hydrateFromSnapshot = useAdminShellStore((state) => state.hydrateFromSnapshot);
  const setFacebookProfile = useAdminShellStore((state) => state.setFacebookProfile);

  useEffect(() => {
    if (initialDashboardSnapshot) {
      hydrateFromSnapshot(initialDashboardSnapshot);
    }
    if (initialFacebookProfile) {
      setFacebookProfile(initialFacebookProfile);
    }
  }, [hydrateFromSnapshot, initialDashboardSnapshot, initialFacebookProfile, setFacebookProfile]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
