import type { ReactNode } from "react";

import { AdminClientProvider } from "@/components/admin/AdminClientProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminClientProvider>
      <AdminShell
        title="Admin workspace"
      >
        {children}
      </AdminShell>
    </AdminClientProvider>
  );
}
