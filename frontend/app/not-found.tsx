import Link from "next/link";

import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f2f2f2] px-4 py-8">
      <div className="grid w-full max-w-[620px] justify-items-center gap-4 rounded-[2rem] border border-[rgba(160,183,164,0.24)] bg-[rgba(255,255,255,0.72)] px-8 py-10 text-center shadow-soft">
        <BrandLogo compact />
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Error 404</div>
        <h1 className="font-serif text-[clamp(2.6rem,6vw,4rem)] leading-[0.98] text-foreground">
          This page could not be found.
        </h1>
        <p className="max-w-[420px] text-[0.98rem] leading-[1.8] text-[#727975]">
          The link may be outdated, removed, or typed incorrectly.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonVariants()}>
            Back home
          </Link>
          <Link href="/jobs" className={cn(buttonVariants({ variant: "secondary" }))}>
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
