"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 right-0 top-0 z-20 px-4 py-4">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-8 px-2 py-2">
        <BrandLogo compact inline className="nav-brand-logo" />
        <div className="flex items-center justify-center gap-1">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center rounded-full border-b-2 px-4 py-2 text-[0.92rem] font-medium transition-colors",
              pathname === "/"
                ? "border-[#8da693] text-foreground"
                : "border-transparent text-[#454c49]/78 hover:text-foreground",
            )}
          >
            Home
          </Link>
          <Link
            href="/jobs"
            className={cn(
              "inline-flex items-center rounded-full border-b-2 px-4 py-2 text-[0.92rem] font-medium transition-colors",
              pathname?.startsWith("/jobs")
                ? "border-[#8da693] text-foreground"
                : "border-transparent text-[#454c49]/78 hover:text-foreground",
            )}
          >
            Jobs
          </Link>
          <Link
            href="/about"
            className={cn(
              "inline-flex items-center rounded-full border-b-2 px-4 py-2 text-[0.92rem] font-medium transition-colors",
              pathname === "/about"
                ? "border-[#8da693] text-foreground"
                : "border-transparent text-[#454c49]/78 hover:text-foreground",
            )}
          >
            About
          </Link>
        </div>
        <Link
          href="/admin/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "border-b-2 border-transparent rounded-full",
            pathname?.startsWith("/admin") && "border-[#8da693] text-foreground",
          )}
        >
          Login
        </Link>
      </div>
    </nav>
  );
}
