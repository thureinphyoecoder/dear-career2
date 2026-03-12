import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesColumn,
  Database,
  FileClock,
  Globe,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardSnapshot } from "@/lib/api-admin";
import { cn } from "@/lib/utils";

function formatDateTime(value?: string) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(parsed);
}

function getPendingJobId(value: string) {
  const match = value.match(/(\d+)$/);
  return match?.[1] ?? "";
}

function labelRequestedAction(value: "publish" | "facebook-upload" | "manual-review") {
  if (value === "publish") return "Publish review";
  if (value === "facebook-upload") return "Facebook review";
  return "Manual review";
}

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();
  const visitorSummary = snapshot.visitor_summary;
  const healthySources = snapshot.sources.filter((source) => source.status === "healthy").length;
  const warningSources = snapshot.sources.filter((source) => source.status === "warning").length;
  const pausedSources = snapshot.sources.filter((source) => source.status === "paused").length;

  const statItems = [
    {
      label: "Live jobs",
      value: snapshot.published_jobs,
      meta: `${snapshot.pending_count} pending`,
      icon: ShieldCheck,
      href: "/admin/jobs?status=published",
    },
    {
      label: "Pending",
      value: snapshot.pending_count,
      meta: `${snapshot.pending_approvals.length} in queue`,
      icon: FileClock,
      href: "/admin/approvals",
    },
    {
      label: "Import sources",
      value: snapshot.source_count,
      meta: `${healthySources} healthy`,
      icon: Database,
      href: "/admin/sources",
    },
    {
      label: "Visitors",
      value: snapshot.total_visitors,
      meta: `${visitorSummary?.today_visitors ?? 0} today`,
      icon: Globe,
      href: "/admin/analytics",
    },
    {
      label: "Draft jobs",
      value: snapshot.draft_jobs,
      meta: `${snapshot.total_jobs} total jobs`,
      icon: ChartNoAxesColumn,
      href: "/admin/jobs?status=draft",
    },
    {
      label: "Active ads",
      value: snapshot.active_ads,
      meta: "campaigns running",
      icon: Megaphone,
      href: "/admin/ads",
    },
  ] as const;

  return (
    <div className="grid max-w-none gap-4 xl:pr-4">
      <header className="flex items-center justify-between">
        <div className="grid gap-1">
          <span className="text-[0.76rem] uppercase tracking-[0.18em] text-[#7a897f]">Overview</span>
          <h1 className="text-[1.9rem] font-semibold leading-none text-[#2d3a33]">Dashboard</h1>
          <p className="text-sm text-[#6e7b74]">Daily operations, approvals, and source health.</p>
        </div>
        <Link href="/admin/jobs/new" className={cn(buttonVariants(), "h-11 rounded-xl px-5 text-[0.95rem]")}>
          New job
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {statItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="rounded-2xl border-[#ccd9cf] bg-white shadow-none transition-colors hover:border-[#afc2b4] hover:bg-[#fcfefd]">
              <CardContent className="grid gap-2 p-4">
                <div className="inline-flex items-center justify-between gap-3 text-[#6a766f]">
                  <span className="text-[0.78rem] uppercase tracking-[0.12em]">{item.label}</span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#edf4ef] text-[#5c7063]">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <strong className="text-[2rem] font-semibold leading-none text-[#334039]">{item.value}</strong>
                <div className="inline-flex items-center justify-between text-[0.8rem] text-[#77847d]">
                  <span>{item.meta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,1fr)]">
        <Card className="rounded-2xl border-[#ccd9cf] bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[1rem] font-semibold text-foreground">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/admin/approvals"
              className="rounded-xl border border-[#d6e1d9] bg-[#f8fcf9] px-4 py-3 text-sm font-medium text-[#314138] transition-colors hover:bg-[#edf5ef]"
            >
              Review pending jobs
              <div className="mt-1 text-xs text-[#6f7d76]">{snapshot.pending_count} waiting for action</div>
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-xl border border-[#d6e1d9] bg-[#f8fcf9] px-4 py-3 text-sm font-medium text-[#314138] transition-colors hover:bg-[#edf5ef]"
            >
              Handle user reports
              <div className="mt-1 text-xs text-[#6f7d76]">Review and close report tickets</div>
            </Link>
            <Link
              href="/admin/sources"
              className="rounded-xl border border-[#d6e1d9] bg-[#f8fcf9] px-4 py-3 text-sm font-medium text-[#314138] transition-colors hover:bg-[#edf5ef]"
            >
              Manage import sources
              <div className="mt-1 text-xs text-[#6f7d76]">
                {healthySources} healthy, {warningSources} warning, {pausedSources} paused
              </div>
            </Link>
            <Link
              href="/admin/facebook"
              className="rounded-xl border border-[#d6e1d9] bg-[#f8fcf9] px-4 py-3 text-sm font-medium text-[#314138] transition-colors hover:bg-[#edf5ef]"
            >
              Check Facebook sync
              <div className="mt-1 text-xs text-[#6f7d76]">Verify page connection and posting flow</div>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#ccd9cf] bg-white shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[1rem] font-semibold text-foreground">Source health</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {snapshot.sources.slice(0, 5).map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-xl border border-[#d6e1d9] bg-[#fbfdfb] px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-[#34423b]">{source.label}</div>
                  <div className="truncate text-xs text-[#78857e]">{source.domain}</div>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em]",
                    source.status === "healthy" && "border-[#b8d0c0] bg-[#edf7f0] text-[#345440]",
                    source.status === "warning" && "border-[#e4d4ae] bg-[#fcf6e8] text-[#7a5c1e]",
                    source.status === "paused" && "border-[#d7dbd9] bg-[#f3f5f4] text-[#626f68]",
                  )}
                >
                  {source.status}
                </span>
              </div>
            ))}
            {snapshot.sources.length === 0 ? (
              <div className="rounded-xl border border-[#d6e1d9] bg-[#fbfdfb] px-3 py-4 text-sm text-[#6f7d76]">
                No sources configured yet.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <Card className="rounded-2xl border-[#ccd9cf] bg-white shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[1rem] font-semibold text-foreground">Pending jobs queue</CardTitle>
            <Link href="/admin/approvals" className="text-sm text-[#6f876f] hover:underline">
              Open full queue
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {snapshot.pending_approvals.length === 0 ? (
              <div className="px-6 py-6 text-sm text-[#6d7771]">No pending jobs.</div>
            ) : (
              <div className="max-h-[520px] overflow-auto">
                {snapshot.pending_approvals.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 border-t border-[#d8e2da] px-5 py-3.5 first:border-t-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="line-clamp-1 font-medium text-[#334039]">{item.title}</strong>
                        <div className="mt-1 inline-flex items-center gap-2 text-xs text-[#74827b]">
                          <span>{item.source_label}</span>
                          <span>•</span>
                          <span>{labelRequestedAction(item.requested_action)}</span>
                        </div>
                      </div>
                      {getPendingJobId(item.id) ? (
                        <Link
                          href={`/admin/jobs/${getPendingJobId(item.id)}?returnTo=${encodeURIComponent("/admin/approvals")}`}
                          className={cn(buttonVariants(), "h-8 shrink-0 rounded-lg px-3 text-xs")}
                        >
                          Review
                        </Link>
                      ) : null}
                    </div>
                    <span className="text-xs text-[#7a847e]">{formatDateTime(item.requested_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
