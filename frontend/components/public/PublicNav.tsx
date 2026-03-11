"use client";

import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const pathname = usePathname();
  const [homeSection, setHomeSection] = useState<"home" | "jobs">("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const linkClass =
    "relative inline-flex items-center px-3 pb-2.5 pt-2 text-[0.88rem] font-medium transition-colors sm:px-4 sm:text-[0.92rem] after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[rgba(141,166,147,0.7)] after:transition-all";

  useEffect(() => {
    if (pathname !== "/") {
      setHomeSection("home");
      return;
    }

    let rafId = 0;
    let observerBound = false;
    const observer = new IntersectionObserver(
      () => {
        cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(updateHomeSection);
      },
      {
        threshold: [0, 0.2, 0.45, 0.7],
        rootMargin: "-84px 0px -35% 0px",
      },
    );

    const bindObserver = () => {
      if (observerBound) return;
      const heroSection = document.getElementById("home-hero-section");
      const jobsSection = document.getElementById("home-jobs-section");
      if (!jobsSection) return;

      if (heroSection) {
        observer.observe(heroSection);
      }
      observer.observe(jobsSection);
      observerBound = true;
    };

    const updateHomeSection = () => {
      bindObserver();
      const jobsSection = document.getElementById("home-jobs-section");
      if (!jobsSection) {
        return;
      }

      const anchor = window.innerHeight * 0.4;
      const jobsTop = jobsSection.getBoundingClientRect().top;
      setHomeSection(jobsTop <= anchor ? "jobs" : "home");
    };

    updateHomeSection();
    window.addEventListener("scroll", updateHomeSection, { passive: true });
    window.addEventListener("resize", updateHomeSection);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("scroll", updateHomeSection);
      window.removeEventListener("resize", updateHomeSection);
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const homeActive = pathname === "/" ? homeSection === "home" : pathname === "/";
  const jobsActive = pathname === "/" ? homeSection === "jobs" : pathname?.startsWith("/jobs");
  const contactActive = pathname === "/contact";
  const cvGuideActive = pathname === "/cv-guide";
  const jobAlertActive = pathname === "/job-alert";
  const showSolidNav = pathname !== "/";

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-20 px-3 py-3 sm:px-6 sm:py-4",
        showSolidNav
          ? "border-b border-[rgba(160,183,164,0.14)] bg-[rgba(251,249,245,0.92)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
        <BrandLogo compact inline className="nav-brand-logo min-w-0" />
        <div className="hidden items-center justify-center gap-1 sm:flex">
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
              "relative inline-flex items-center px-3 pb-2.5 pt-2 text-[0.96rem] font-medium transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[rgba(141,166,147,0.7)] after:transition-all sm:px-4 sm:text-[1rem]",
              pathname === "/about"
                ? "text-[#2f3a34] after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            About
          </Link>
          <Link
            href="/cv-guide"
            className={cn(
              linkClass,
              cvGuideActive
                ? "text-[#2f3a34] after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            CV Guide
          </Link>
          <Link
            href="/job-alert"
            className={cn(
              linkClass,
              jobAlertActive
                ? "text-[#2f3a34] after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            <Bell className="nav-bell-attention mr-1 h-3.5 w-3.5" />
            Job Alert
          </Link>
          <Link
            href="/contact"
            className={cn(
              linkClass,
              contactActive
                ? "text-[#2f3a34] after:w-[62%]"
                : "text-[#4f5954] hover:text-[#2f3a34]",
            )}
          >
            Contact
          </Link>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(160,183,164,0.2)] bg-[rgba(255,255,255,0.48)] text-[#4f5954] backdrop-blur sm:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
          >
            {mobileOpen ? <X size={18} strokeWidth={1.9} /> : <Menu size={18} strokeWidth={1.9} />}
          </button>
          <Link
            href="/admin/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden rounded-full px-3 text-[#4f5954] sm:inline-flex sm:px-4",
              pathname?.startsWith("/admin") && "bg-[rgba(141,166,147,0.12)] text-[#2f3a34]",
            )}
          >
            Login
          </Link>
        </div>
      </div>
      {mobileOpen ? (
        <div
          id="public-mobile-menu"
          className="mt-2 grid w-full gap-1 rounded-2xl border border-[rgba(160,183,164,0.2)] bg-[rgba(255,255,255,0.94)] p-2 shadow-soft sm:hidden"
        >
          <Link
            href="/"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              homeActive ? "bg-[rgba(141,166,147,0.14)] text-[#2f3a34]" : "text-[#4f5954]",
            )}
          >
            Home
          </Link>
          <Link
            href="/jobs"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              jobsActive ? "bg-[rgba(141,166,147,0.14)] text-[#2f3a34]" : "text-[#4f5954]",
            )}
          >
            Jobs
          </Link>
          <Link
            href="/about"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              pathname === "/about" ? "bg-[rgba(141,166,147,0.14)] text-[#2f3a34]" : "text-[#4f5954]",
            )}
          >
            About
          </Link>
          <Link
            href="/cv-guide"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              cvGuideActive ? "bg-[rgba(141,166,147,0.14)] text-[#2f3a34]" : "text-[#4f5954]",
            )}
          >
            CV Guide
          </Link>
          <Link
            href="/job-alert"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              jobAlertActive ? "bg-[rgba(141,166,147,0.14)] text-[#2f3a34]" : "text-[#4f5954]",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Bell className="nav-bell-attention h-3.5 w-3.5" />
              Job Alert
            </span>
          </Link>
          <Link
            href="/contact"
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              contactActive ? "bg-[rgba(141,166,147,0.14)] text-[#2f3a34]" : "text-[#4f5954]",
            )}
          >
            Contact
          </Link>
          <Link
            href="/admin/login"
            className="mt-1 inline-flex items-center justify-center rounded-xl border border-[rgba(160,183,164,0.24)] bg-[rgba(247,243,236,0.72)] px-3 py-2 text-sm font-medium text-[#2f3a34]"
          >
            Login
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
