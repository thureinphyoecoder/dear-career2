"use client";

import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Shield,
} from "lucide-react";
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

  const navGroups = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          active: pathname === "/admin",
        },
      ],
    },
    {
      label: "Publishing",
      icon: BriefcaseBusiness,
      items: [
        {
          href: "/admin/jobs",
          label: "Jobs",
          active:
            pathname === "/admin/jobs" ||
            (pathname?.startsWith("/admin/jobs/") && pathname !== "/admin/jobs/new"),
        },
        {
          href: "/admin/jobs/new",
          label: "Create job",
          active: pathname === "/admin/jobs/new",
        },
        {
          href: "/admin/approvals",
          label: "Approvals",
          active: pathname === "/admin/approvals",
        },
      ],
    },
    {
      label: "Source",
      icon: FolderKanban,
      items: [
        {
          href: "/admin/sources",
          label: "Sources",
          active: pathname?.startsWith("/admin/sources"),
        },
        {
          href: "/admin/fetch",
          label: "Fetch settings",
          active: pathname?.startsWith("/admin/fetch"),
        },
        {
          href: "/admin/facebook",
          label: "Facebook upload",
          active: pathname?.startsWith("/admin/facebook"),
        },
      ],
    },
  ];

  return (
    <div className="grid min-h-screen bg-[#f8f9f8] lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-border/60 bg-[#f5f7f5] px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6 lg:overflow-y-auto">
          <BrandLogo compact inline className="admin-brand-logo" />

          <div className="grid gap-4 border-t border-border/60 pt-3">
            <div className="px-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </div>
            {navGroups.map((group) => (
              <div key={group.label} className="grid gap-1">
                <div className="flex min-h-[32px] items-center gap-3 px-3 text-[0.92rem] text-[#465049]">
                  <group.icon size={16} strokeWidth={1.9} />
                  <span className="font-medium">{group.label}</span>
                </div>
                <div className="ml-4 grid gap-1 border-l border-border/70 pl-4">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex min-h-[34px] items-center rounded-lg px-2.5 text-[0.88rem] transition-colors",
                        item.active
                          ? "text-[#30423a]"
                          : "text-[#7a847e] hover:text-[#465049]",
                      )}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto grid gap-2 pt-4">
            <a
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full justify-center rounded-xl bg-white",
              )}
              href={djangoAdminUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Shield size={16} strokeWidth={1.9} />
              Django admin
            </a>
          </div>
        </div>
      </aside>

      <main className="px-5 py-5 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-none">
          <div className="grid gap-0.5">
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[#8da693]">
              Admin workspace
            </span>
            <span className="text-sm font-medium text-[#334039]">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-[#fafbfa] text-[#6f7b73] transition-colors hover:bg-[#f0f4f1] hover:text-[#465049]"
            >
              <Bell size={17} strokeWidth={1.9} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#8da693]" />
            </button>
            <form action="/api/admin/session/logout" method="post">
              <input type="hidden" name="redirect" value="/admin/login" />
              <button
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "h-10 rounded-xl bg-[#fafbfa] px-4",
                )}
                type="submit"
              >
                <LogOut size={16} strokeWidth={1.9} />
                Sign out
              </button>
            </form>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
