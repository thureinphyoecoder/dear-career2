"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="grid min-h-screen bg-[#f2f2f2] lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-[rgba(160,183,164,0.16)] bg-[#fbfbfa] px-4 py-5 lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-5">
          <div className="flex items-center gap-3 border-b border-[rgba(160,183,164,0.16)] pb-4">
            <BrandLogo compact inline className="admin-brand-logo" />
            <div className="grid gap-1">
              <div className="text-[0.72rem] uppercase tracking-[0.14em] text-[#8da693]">
                Dear Career
              </div>
              <h1 className="text-[0.92rem] font-semibold uppercase tracking-[0.08em] text-foreground">
                {title}
              </h1>
            </div>
          </div>

          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={cn(
                  "flex min-h-[42px] items-center rounded-xl border px-3 text-[0.92rem] transition-colors",
                  item.active
                    ? "border-[rgba(160,183,164,0.24)] bg-white shadow-[0_1px_0_rgba(160,183,164,0.08)]"
                    : "border-transparent bg-transparent hover:border-[rgba(160,183,164,0.18)] hover:bg-[rgba(255,255,255,0.88)]",
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="rounded-xl border border-[rgba(160,183,164,0.14)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-[0.84rem] leading-6 text-[#727975]">
            Frontend workspace for intake, review, and publishing control.
          </div>

          <div className="mt-auto grid gap-2">
              <a
                className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
                href={djangoAdminUrl}
                target="_blank"
                rel="noreferrer"
              >
                Django admin
              </a>
              <form action="/api/admin/session/logout" method="post">
                <input type="hidden" name="redirect" value="/admin/login" />
                <button
                  className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-center")}
                  type="submit"
                >
                  Sign out
                </button>
              </form>
          </div>
        </div>
      </aside>
      <main className="px-4 py-6 lg:px-7 lg:py-8">{children}</main>
    </div>
  );
}
