import type { ReactNode } from "react";

import { PublicBackToTopButton } from "@/components/public/PublicBackToTopButton";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicInitialLoader } from "@/components/public/PublicInitialLoader";
import { PublicNav } from "@/components/public/PublicNav";
import { VisitTracker } from "@/components/public/VisitTracker";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <PublicInitialLoader />
      <VisitTracker />
      <PublicNav />
      <div className="flex-1">{children}</div>
      <PublicFooter />
      <PublicBackToTopButton />
    </div>
  );
}
