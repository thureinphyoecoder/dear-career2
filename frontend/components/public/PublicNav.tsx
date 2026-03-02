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
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-8 rounded-[1.8rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.78)] px-8 py-4 shadow-soft backdrop-blur-xl">
        <BrandLogo compact inline className="nav-brand-logo" />
        <div className="flex items-center justify-center gap-1">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-[0.92rem] font-medium text-[#454c49] transition-colors",
              pathname === "/" ? "bg-[rgba(160,183,164,0.14)]" : "hover:bg-[rgba(160,183,164,0.08)]",
            )}
          >
            Home
          </Link>
          <Link
            href="/jobs"
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-[0.92rem] font-medium text-[#454c49] transition-colors",
              pathname?.startsWith("/jobs")
                ? "bg-[rgba(160,183,164,0.14)]"
                : "hover:bg-[rgba(160,183,164,0.08)]",
            )}
          >
            Jobs
          </Link>
          <Link
            href="/about"
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-[0.92rem] font-medium text-[#454c49] transition-colors",
              pathname === "/about"
                ? "bg-[rgba(160,183,164,0.14)]"
                : "hover:bg-[rgba(160,183,164,0.08)]",
            )}
          >
            About
          </Link>
        </div>
        <Link
          href="/admin/login"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            pathname?.startsWith("/admin") && "bg-[rgba(160,183,164,0.2)]",
          )}
        >
          Login
        </Link>
      </div>
    </nav>
  );
}
