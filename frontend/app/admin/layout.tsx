import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { getFacebookCredential } from "@/lib/api-admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const facebookProfile = await getFacebookCredential();

  return (
    <AdminShell title="Operations" initialFacebookProfile={facebookProfile}>
      {children}
    </AdminShell>
  );
}
