import type { ReactNode } from "react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicNav } from "@/components/public/PublicNav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <PublicNav />
      {children}
      <PublicFooter />
    </div>
  );
}
