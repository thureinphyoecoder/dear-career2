"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/public/BrandLogo";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PublicNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const djangoAdminUrl =
    process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL ?? "http://127.0.0.1:8000/admin/";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="public-nav">
      <BrandLogo compact className="nav-brand-logo" />
      <button
        type="button"
        className="public-nav-toggle"
        aria-expanded={isMenuOpen}
        aria-controls="public-nav-links"
        aria-label="Toggle navigation menu"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <MenuIcon />
      </button>
      <div
        id="public-nav-links"
        className={[
          "public-nav-links",
          isMenuOpen ? "is-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Link
          href="/"
          className={pathname === "/" ? "public-nav-link is-active" : "public-nav-link"}
        >
          Home
        </Link>
        <Link
          href="/jobs"
          className={pathname?.startsWith("/jobs") ? "public-nav-link is-active" : "public-nav-link"}
        >
          Jobs
        </Link>
        <Link
          href="/about"
          className={pathname === "/about" ? "public-nav-link is-active" : "public-nav-link"}
        >
          About
        </Link>
        <a href={djangoAdminUrl} target="_blank" rel="noreferrer">
          Django Admin
        </a>
      </div>
    </nav>
  );
}
