import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDashboardSnapshot } from "@/lib/api-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const snapshot = await getAdminDashboardSnapshot();

  return (
    <AdminShell
      title="Operations"
      initialSidebarCounts={{
        publishedJobs: snapshot.published_jobs,
        pendingApprovals: snapshot.pending_approvals.length,
      }}
    >
      {children}
    </AdminShell>
  );
}
