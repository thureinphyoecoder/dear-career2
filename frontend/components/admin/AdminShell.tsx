"use client";

import Link from "next/link";
import {
  CircleUserRound,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  FolderKanban,
  LogOut,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { BrandLogo } from "@/components/public/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { useAdminDashboardQuery, useFacebookCredentialQuery } from "@/lib/admin-queries";
import { useAdminShellStore } from "@/lib/admin-store";
import type { AdminDashboardSnapshot, AdminNotification, FacebookPageCredential } from "@/lib/types";
import { cn } from "@/lib/utils";

function normalizeFacebookProfile(profile?: FacebookPageCredential | null) {
  if (!profile) return null;
  if (profile.profile_name || profile.account_name || profile.profile_image_url) {
    return profile;
  }
  return null;
}

export function AdminShell({
  children,
  title = "Admin",
  initialDashboardSnapshot,
  initialFacebookProfile,
  initialNotifications = [],
}: {
  children: ReactNode;
  title?: string;
  initialDashboardSnapshot?: AdminDashboardSnapshot;
  initialFacebookProfile?: FacebookPageCredential | null;
  initialNotifications?: AdminNotification[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPublishedView = pathname === "/admin/jobs" && searchParams?.get("status") === "published";
  const isDraftView = pathname === "/admin/jobs" && searchParams?.get("status") === "draft";
  const isPendingView = pathname === "/admin/jobs" && searchParams?.get("status") === "pending-review";
  const sidebarCollapsed = useAdminShellStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAdminShellStore((state) => state.setSidebarCollapsed);
  const sidebarCounts = useAdminShellStore((state) => state.sidebarCounts);
  const facebookProfileFromStore = useAdminShellStore((state) => state.facebookProfile);
  const hydrateFromSnapshot = useAdminShellStore((state) => state.hydrateFromSnapshot);
  const setFacebookProfile = useAdminShellStore((state) => state.setFacebookProfile);
  const dashboardQuery = useAdminDashboardQuery(initialDashboardSnapshot);
  const facebookCredentialQuery = useFacebookCredentialQuery(initialFacebookProfile);
  const facebookProfile =
    normalizeFacebookProfile(facebookCredentialQuery.data) ??
    normalizeFacebookProfile(facebookProfileFromStore) ??
    normalizeFacebookProfile(initialFacebookProfile);
  const [headerImageFailed, setHeaderImageFailed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Home: true,
    Jobs: true,
    "Import tools": true,
  });

  useEffect(() => {
    if (dashboardQuery.data) {
      hydrateFromSnapshot(dashboardQuery.data);
    }
  }, [dashboardQuery.data, hydrateFromSnapshot]);

  useEffect(() => {
    if (facebookCredentialQuery.data) {
      setFacebookProfile(facebookCredentialQuery.data);
    }
  }, [facebookCredentialQuery.data, setFacebookProfile]);

  useEffect(() => {
    setHeaderImageFailed(false);
  }, [facebookProfile?.profile_image_url]);

  const navGroups = [
    {
      label: "Home",
      icon: LayoutDashboard,
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          active: pathname === "/admin",
        },
        {
          href: "/admin/analytics",
          label: "Visitor activity",
          active: pathname === "/admin/analytics",
        },
        {
          href: "/admin/cv-guide",
          label: "CV guide",
          active: pathname === "/admin/cv-guide",
        },
      ],
    },
    {
      label: "Jobs",
      icon: BriefcaseBusiness,
      items: [
        {
          href: "/admin/jobs",
          label: "All jobs",
          active:
            (!isPublishedView && !isDraftView && !isPendingView && pathname === "/admin/jobs") ||
            (pathname?.startsWith("/admin/jobs/") && pathname !== "/admin/jobs/new"),
          badge: sidebarCounts.allJobs,
        },
        {
          href: "/admin/jobs?status=draft",
          label: "Draft",
          active: isDraftView,
          badge: sidebarCounts.draftedJobs,
        },
        {
          href: "/admin/jobs?status=published",
          label: "Published",
          active: isPublishedView,
          badge: sidebarCounts.publishedJobs,
        },
        {
          href: "/admin/jobs?status=pending-review",
          label: "Pending",
          active: pathname === "/admin/approvals" || isPendingView,
          badge: sidebarCounts.pendingApprovals,
        },
        {
          href: "/admin/reports",
          label: "User reports",
          active: pathname === "/admin/reports",
        },
        {
          href: "/admin/jobs/new",
          label: "Add job",
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
      label: "Import tools",
      icon: FolderKanban,
      items: [
        {
          href: "/admin/sources",
          label: "Import sources",
          active: pathname?.startsWith("/admin/sources"),
        },
        {
          href: "/admin/fetch",
          label: "Auto import settings",
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

  const activeNavItem =
    navGroups.flatMap((group) => group.items).find((item) => item.active) ??
    navGroups[0]?.items[0];
  const headerLabel = activeNavItem?.label ?? title;
  const gridTemplateColumns = sidebarCollapsed ? "96px minmax(0, 1fr)" : "248px minmax(0, 1fr)";

  return (
    <div
      className={cn(
        "grid min-h-screen bg-[#f8f9f8] transition-[grid-template-columns]",
      )}
      style={{ gridTemplateColumns }}
    >
      <aside
        className={cn(
          "border-b border-border/60 bg-[#f5f7f5] px-4 py-4 transition-all sm:px-5 sm:py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r",
          sidebarCollapsed && "px-3",
        )}
      >
        <div className="flex h-full flex-col gap-6 lg:overflow-y-auto">
          <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "justify-start")}>
            {sidebarCollapsed ? (
              <Link
                href="/admin"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d6e0d9] bg-white/90"
                title="Admin home"
              >
                <img src="/logoflat.svg" alt="" aria-hidden="true" className="h-7 w-7" />
              </Link>
            ) : (
              <BrandLogo compact inline className="admin-brand-logo" />
            )}
          </div>

          <div className="grid gap-4 border-t border-[#d9e2db] pt-3">
            {!sidebarCollapsed ? (
              <div className="px-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {title}
              </div>
            ) : null}
            {navGroups.map((group) => (
              <div key={group.label} className="grid gap-1">
                {sidebarCollapsed ? (
                  <Link
                    href={group.items.find((item) => item.active)?.href ?? group.items[0]?.href ?? "/admin"}
                    title={group.label}
                    aria-label={group.label}
                    className={cn(
                      "relative inline-flex h-10 w-full items-center justify-center rounded-lg border transition-colors",
                      group.items.some((item) => item.active)
                        ? "border-[#a9beaf] bg-[#e9f1eb] text-[#2f4236]"
                        : "border-transparent text-[#5f6d66] hover:border-[#d4ddd6] hover:bg-[#edf3ef]",
                    )}
                  >
                    <group.icon size={17} strokeWidth={1.9} />
                  </Link>
                ) : (
                <div
                  className={cn(
                    "flex min-h-[34px] w-full items-center rounded-md border border-transparent px-1 text-left text-[0.82rem] transition-colors",
                    group.items.some((item) => item.active)
                      ? "text-[#2a3831]"
                      : "text-[#5c6962]",
                    sidebarCollapsed ? "justify-center gap-0 px-2" : "gap-3",
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center",
                      sidebarCollapsed ? "justify-center gap-0" : "gap-3",
                    )}
                    onClick={() =>
                      setExpandedGroups((current) => ({
                        ...current,
                        [group.label]: !current[group.label],
                      }))
                    }
                    aria-expanded={expandedGroups[group.label] !== false}
                    aria-label={`${group.label} section`}
                  >
                    <group.icon size={16} strokeWidth={1.9} />
                    {!sidebarCollapsed ? <span className="font-medium">{group.label}</span> : null}
                    {!sidebarCollapsed ? (
                      <ChevronDown
                        size={15}
                        strokeWidth={1.9}
                        className={cn(
                          "ml-auto text-[#7a857f] transition-transform",
                          expandedGroups[group.label] !== false ? "rotate-180" : "rotate-0",
                        )}
                      />
                    ) : null}
                  </button>
                </div>
                )}
                {!sidebarCollapsed && expandedGroups[group.label] !== false ? (
                  <div className="ml-1 grid gap-1 border-l border-[#d8e2da] pb-1 pl-3 pt-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        className={cn(
                          "relative flex min-h-[34px] items-center justify-between gap-3 rounded-md px-2.5 text-[0.9rem] transition-colors",
                          item.active
                            ? "bg-[#eaf2ec] font-semibold text-[#24332b] before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-r-full before:bg-[#6d8b79]"
                            : "text-[#6d7871] hover:bg-[#edf2ee] hover:text-[#344039]",
                        )}
                        href={item.href}
                      >
                        <span>{item.label}</span>
                        {typeof item.badge === "number" ? (
                          <span
                            className={cn(
                              "inline-flex min-w-[1.7rem] items-center justify-center rounded-full border px-1.5 py-0.5 text-[0.72rem] font-semibold",
                              item.active
                                ? "border-[#a9beaf] bg-[#f5faf6] text-[#3a5445]"
                                : "border-[#d6e1d9] bg-[#edf3ef] text-[#5b6a62]",
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
        <div className="mb-5 flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d2ddd5] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(44,56,48,0.05)] sm:px-4">
          <div className="flex min-w-0 items-center gap-2 text-sm text-[#4b5851]">
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d7e0d9] bg-white text-[#5d6a63] transition-colors hover:bg-[#f2f6f3] hover:text-[#2f3b35]"
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              {sidebarCollapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <Link href="/admin" className="shrink-0 rounded-lg px-1 py-1 font-medium text-[#7a847e]">
                {title}
              </Link>
              <span className="text-[#a1aca5]">/</span>
              <span className="truncate rounded-lg px-1 py-1 font-semibold text-[#26342d]">
                {headerLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {facebookProfile ? (
              <div className="hidden items-center gap-2 rounded-xl border border-[#cfdbd2] bg-[#f8fbf9] px-3 py-1.5 sm:flex">
                {facebookProfile.profile_image_url && !headerImageFailed ? (
                  <img
                    src={facebookProfile.profile_image_url}
                    alt={facebookProfile.profile_name || facebookProfile.account_name || "Facebook profile"}
                    className="h-7 w-7 rounded-full object-cover"
                    onError={() => setHeaderImageFailed(true)}
                  />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#e7efe9] text-[#5f6d66]">
                    <CircleUserRound size={15} strokeWidth={1.9} />
                  </span>
                )}
                <span className="text-[0.82rem] font-medium text-[#2c3a33]">
                  {facebookProfile.profile_name || facebookProfile.account_name}
                </span>
              </div>
            ) : null}
            <AdminNotificationBell initialNotifications={initialNotifications} />
            <form action="/api/admin/session/logout" method="post">
              <input type="hidden" name="redirect" value="/admin/login" />
              <button
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "h-10 rounded-xl border-[#cfdbd2] bg-[#f8fbf9] px-4 text-[#34423b] hover:bg-[#edf3ee]",
                )}
                type="submit"
              >
                <LogOut size={16} strokeWidth={1.9} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
