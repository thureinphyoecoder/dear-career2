import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDashboardSnapshot, getFacebookCredential } from "@/lib/api-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [facebookProfile, snapshot] = await Promise.all([
    getFacebookCredential(),
    getAdminDashboardSnapshot(),
  ]);

  return (
    <AdminShell
      title="Operations"
      initialFacebookProfile={facebookProfile}
      initialSidebarCounts={{
        publishedJobs: snapshot.published_jobs,
        pendingApprovals: snapshot.pending_approvals.length,
      }}
    >
      {children}
    </AdminShell>
  );
}
