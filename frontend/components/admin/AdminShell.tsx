"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/public/BrandLogo";

export function AdminShell({
  children,
  title = "Admin",
}: {
  children: ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const djangoAdminUrl =
    process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL ?? "http://127.0.0.1:8000/admin/";

  const navItems = [
    { href: "/admin", label: "Overview", active: pathname === "/admin" },
    { href: "/admin/jobs", label: "Jobs", active: pathname?.startsWith("/admin/jobs") },
    {
      href: "/admin/sources",
      label: "Fetch settings",
      active: pathname?.startsWith("/admin/sources"),
    },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-stack">
          <div className="admin-brand-block">
            <div className="eyebrow">Dear Career</div>
            <BrandLogo compact inline className="admin-brand-logo" />
            <h1 className="admin-sidebar-title">{title}</h1>
            <p className="admin-sidebar-copy">
              Editorial workflow for listings, manual source intake, and fetch operations.
            </p>
          </div>

          <nav className="admin-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={item.active ? "admin-link is-active" : "admin-link"}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar-section">
            <div className="eyebrow">Utilities</div>
            <div className="admin-sidebar-actions">
              <a
                className="button secondary admin-django-link"
                href={djangoAdminUrl}
                target="_blank"
                rel="noreferrer"
              >
                Django admin
              </a>
              <form action="/api/admin/session/logout" method="post">
                <input type="hidden" name="redirect" value="/admin/login" />
                <button className="button secondary admin-django-link" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
