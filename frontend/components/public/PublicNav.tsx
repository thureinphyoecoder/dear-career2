"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const pathname = usePathname();
  const [homeSection, setHomeSection] = useState<"home" | "jobs">("home");
  const linkClass =
    "relative inline-flex items-center px-3 pb-2.5 pt-2 text-[0.88rem] font-medium transition-colors sm:px-4 sm:text-[0.92rem] after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[rgba(141,166,147,0.7)] after:transition-all";

  useEffect(() => {
    if (pathname !== "/") {
      setHomeSection("home");
      return;
    }

    const heroSection = document.getElementById("home-hero-section");
    const jobsSection = document.getElementById("home-jobs-section");
    if (!heroSection || !jobsSection) {
      return;
    }

    const updateHomeSection = () => {
      const anchor = window.innerHeight * 0.4;
      const jobsTop = jobsSection.getBoundingClientRect().top;
      setHomeSection(jobsTop <= anchor ? "jobs" : "home");
    };

    updateHomeSection();

    const observer = new IntersectionObserver(updateHomeSection, {
      threshold: [0, 0.2, 0.45, 0.7],
      rootMargin: "-84px 0px -35% 0px",
    });

    observer.observe(heroSection);
    observer.observe(jobsSection);
    window.addEventListener("scroll", updateHomeSection, { passive: true });
    window.addEventListener("resize", updateHomeSection);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHomeSection);
      window.removeEventListener("resize", updateHomeSection);
    };
  }, [pathname]);

  const homeActive = pathname === "/" ? homeSection === "home" : pathname === "/";
  const jobsActive = pathname === "/" ? homeSection === "jobs" : pathname?.startsWith("/jobs");

  return (
    <nav className="fixed left-0 right-0 top-0 z-20 px-4 py-4">
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 px-2 py-2 sm:gap-8">
        <BrandLogo compact inline className="nav-brand-logo" />
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <Link
            href="/"
            className={cn(
              linkClass,
              homeActive
                ? "text-[#2f3a34] after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            Home
          </Link>
          <Link
            href="/jobs"
            className={cn(
              linkClass,
              jobsActive
                ? "text-[#2f3a34] after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            Jobs
          </Link>
          <Link
            href="/about"
            className={cn(
              "relative hidden sm:inline-flex sm:items-center sm:px-4 sm:pb-2.5 sm:pt-2 sm:text-[0.92rem] sm:font-medium sm:transition-colors sm:after:absolute sm:after:bottom-0 sm:after:left-1/2 sm:after:h-px sm:after:w-0 sm:after:-translate-x-1/2 sm:after:bg-[rgba(141,166,147,0.7)] sm:after:transition-all",
              pathname === "/about"
                ? "text-[#2f3a34] sm:after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            About
          </Link>
        </div>
        <Link
          href="/admin/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "rounded-full px-3 text-[#4f5954] sm:px-4",
            pathname?.startsWith("/admin") && "bg-[rgba(141,166,147,0.12)] text-[#2f3a34]",
          )}
        >
          Login
        </Link>
      </div>
    </nav>
  );
}
