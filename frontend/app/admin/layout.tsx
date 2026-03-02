import type { ReactNode } from "react";

import { AdminClientProvider } from "@/components/admin/AdminClientProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDashboardSnapshot, getFacebookCredential } from "@/lib/api-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [snapshot, facebookProfile] = await Promise.all([
    getAdminDashboardSnapshot(),
    getFacebookCredential(),
  ]);

  return (
    <AdminClientProvider
      initialDashboardSnapshot={snapshot}
      initialFacebookProfile={facebookProfile}
    >
      <AdminShell
        title="Operations"
        initialDashboardSnapshot={snapshot}
        initialFacebookProfile={facebookProfile}
        initialNotifications={snapshot.notifications}
      >
        {children}
      </AdminShell>
    </AdminClientProvider>
  );
}
