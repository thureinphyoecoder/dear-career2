"use client";

import Link from "next/link";
import {
  CircleUserRound,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import type { FacebookPageCredential } from "@/lib/types";
import { cn } from "@/lib/utils";

const ADMIN_DATA_CHANGED_EVENT = "admin-data-changed";

export function AdminShell({
  children,
  title = "Admin",
  initialFacebookProfile,
  initialSidebarCounts,
}: {
  children: ReactNode;
  title?: string;
  initialFacebookProfile?: FacebookPageCredential | null;
  initialSidebarCounts?: {
    publishedJobs: number;
    pendingApprovals: number;
  };
}) {
  const pathname = usePathname();
  const djangoAdminUrl =
    process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL ?? "http://127.0.0.1:8000/admin/";
  const breadcrumbSegments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((segment, index, segments) => ({
      label: segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
      href: `/admin/${segments.slice(0, index + 1).join("/")}`,
      isLast: index === segments.length - 1,
    }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [facebookProfile, setFacebookProfile] = useState<FacebookPageCredential | null>(
    initialFacebookProfile &&
      (initialFacebookProfile.profile_name ||
        initialFacebookProfile.account_name ||
        initialFacebookProfile.profile_image_url)
      ? initialFacebookProfile
      : null,
  );
  const [sidebarCounts, setSidebarCounts] = useState(
    initialSidebarCounts ?? {
      publishedJobs: 0,
      pendingApprovals: 0,
    },
  );

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
        {
          href: "/admin/analytics",
          label: "Analytics",
          active: pathname === "/admin/analytics",
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
          href: "/admin/jobs?status=published",
          label: "Published",
          active: false,
          badge: sidebarCounts.publishedJobs,
        },
        {
          href: "/admin/approvals",
          label: "Pending",
          active: pathname === "/admin/approvals",
          badge: sidebarCounts.pendingApprovals,
        },
        {
          href: "/admin/jobs/new",
          label: "Create job",
          active: pathname === "/admin/jobs/new",
        },
        {
          href: "/admin/ads",
          label: "Ads",
          active: pathname === "/admin/ads",
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
          label: "Facebook",
          active: pathname?.startsWith("/admin/facebook"),
        },
      ],
    },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadShellState() {
      try {
        const [facebookResponse, dashboardResponse] = await Promise.all([
          fetch("/api/admin/proxy/jobs/admin/channels/facebook"),
          fetch("/api/admin/proxy/jobs/admin/dashboard"),
        ]);

        if (facebookResponse.ok) {
          const data = (await facebookResponse.json()) as FacebookPageCredential;
          if (!cancelled && (data.profile_name || data.account_name || data.profile_image_url)) {
            setFacebookProfile(data);
          }
        }

        if (dashboardResponse.ok) {
          const data = (await dashboardResponse.json()) as {
            published_jobs?: number;
            pending_approvals?: Array<unknown>;
          };
          if (!cancelled) {
            setSidebarCounts({
              publishedJobs: data.published_jobs ?? 0,
              pendingApprovals: data.pending_approvals?.length ?? 0,
            });
          }
        }
      } catch {
        // Ignore shell refresh failures and keep the initial render responsive.
      }
    }

    void loadShellState();
    function handleAdminDataChanged() {
      void loadShellState();
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handleAdminDataChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handleAdminDataChanged);
    };
  }, []);

  return (
    <div
      className={cn(
        "grid min-h-screen bg-[#f8f9f8] transition-[grid-template-columns]",
        sidebarCollapsed ? "lg:grid-cols-[92px_1fr]" : "lg:grid-cols-[280px_1fr]",
      )}
    >
      <aside
        className={cn(
          "border-b border-border/60 bg-[#f5f7f5] px-5 py-5 transition-all lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r",
          sidebarCollapsed && "lg:px-3",
        )}
      >
        <div className="flex h-full flex-col gap-6 lg:overflow-y-auto">
          <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "justify-start")}>
            <BrandLogo compact inline className="admin-brand-logo" />
          </div>

          <div className="grid gap-4 border-t border-border/60 pt-3">
            {!sidebarCollapsed ? (
              <div className="px-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </div>
            ) : null}
            {navGroups.map((group) => (
              <details
                key={group.label}
                className="group grid gap-1"
                open={group.items.some((item) => item.active) || undefined}
              >
                <summary
                  className={cn(
                    "flex min-h-[38px] w-full cursor-pointer list-none items-center rounded-xl px-3 text-left text-[0.92rem] transition-colors hover:bg-[#eef3ef]",
                    group.items.some((item) => item.active)
                      ? "bg-[rgba(141,166,147,0.14)] text-[#294037]"
                      : "text-[#465049]",
                    sidebarCollapsed ? "justify-center gap-0 px-2" : "gap-3",
                  )}
                >
                  <group.icon size={16} strokeWidth={1.9} />
                  {!sidebarCollapsed ? <span className="font-medium">{group.label}</span> : null}
                  {!sidebarCollapsed ? (
                    <ChevronDown
                      size={16}
                      strokeWidth={1.9}
                      className={cn(
                        "ml-auto transition-transform group-open:rotate-180",
                      )}
                    />
                  ) : null}
                </summary>
                {!sidebarCollapsed ? (
                  <div className="ml-4 grid gap-1 border-l border-border/70 pb-1 pl-4 pt-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        className={cn(
                          "flex min-h-[34px] items-center justify-between gap-3 rounded-lg border-l-2 px-2.5 text-[0.88rem] transition-colors",
                          item.active
                            ? "border-[rgba(116,141,122,0.7)] bg-[rgba(141,166,147,0.1)] font-medium text-[#294037]"
                            : "border-transparent text-[#7a847e] hover:text-[#465049]",
                        )}
                        href={item.href}
                      >
                        <span>{item.label}</span>
                        {typeof item.badge === "number" ? (
                          <span
                            className={cn(
                              "inline-flex min-w-[1.7rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[0.72rem] font-semibold",
                              item.active
                                ? "bg-[#7f9582] text-white"
                                : "bg-[rgba(141,166,147,0.12)] text-[#5b6a62]",
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </details>
            ))}
          </div>

          <div className="mt-auto grid gap-2 pt-4">
            <a
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full justify-center rounded-xl bg-white",
                sidebarCollapsed && "px-0",
              )}
              href={djangoAdminUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Django admin"
            >
              <Shield size={16} strokeWidth={1.9} />
              {!sidebarCollapsed ? "Django admin" : null}
            </a>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-5 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-none">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto text-sm text-[#5d6861]">
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-[#fafbfa] text-[#6f7b73] transition-colors hover:bg-[#f0f4f1] hover:text-[#465049]"
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={17} strokeWidth={1.9} />
              ) : (
                <PanelLeftClose size={17} strokeWidth={1.9} />
              )}
            </button>
            <Link
              href="/admin"
              className="shrink-0 rounded-lg px-1 py-1 font-medium text-[#334039] transition-colors hover:text-[#1f2a24]"
            >
              {title}
            </Link>
            {breadcrumbSegments.map((segment) => (
              <div key={segment.href} className="flex shrink-0 items-center gap-2">
                <ChevronRight size={14} strokeWidth={1.9} className="text-[#9aa59d]" />
                <Link
                  href={segment.href}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[0.88rem] transition-colors",
                    segment.isLast
                      ? "bg-[#f5f7f5] text-[#4d5a53]"
                      : "bg-[#fafbfa] text-[#66726b] hover:bg-[#f1f5f2] hover:text-[#30423a]",
                  )}
                >
                  {segment.label}
                </Link>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {facebookProfile ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-[#fafbfa] px-3 py-1.5">
                {facebookProfile.profile_image_url ? (
                  <img
                    src={facebookProfile.profile_image_url}
                    alt={facebookProfile.profile_name || facebookProfile.account_name || "Facebook profile"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eef3ef] text-[#6f7b73]">
                    <CircleUserRound size={15} strokeWidth={1.9} />
                  </span>
                )}
                <span className="text-[0.82rem] font-medium text-[#334039]">
                  {facebookProfile.profile_name || facebookProfile.account_name}
                </span>
              </div>
            ) : null}
            <AdminNotificationBell />
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
