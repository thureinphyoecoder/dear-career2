import Link from "next/link";
import { Bell, Database, FileClock, Globe, ShieldCheck } from "lucide-react";

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

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();

  const statItems = [
    {
      label: "Live jobs",
      value: snapshot.published_jobs,
      icon: ShieldCheck,
    },
    {
      label: "Pending",
      value: snapshot.pending_count,
      icon: FileClock,
    },
    {
      label: "Import sources",
      value: snapshot.source_count,
      icon: Database,
    },
    {
      label: "Visitors",
      value: snapshot.total_visitors,
      icon: Globe,
    },
  ] as const;

  return (
    <div className="grid max-w-none gap-5 xl:pr-6">
      <header className="flex justify-end">
        <Link href="/admin/jobs/new" className={cn(buttonVariants(), "rounded-xl")}>
          New job
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.label} className="rounded-2xl border-border/70 bg-white shadow-none">
            <CardContent className="grid gap-1 p-4">
              <div className="inline-flex items-center justify-between gap-3 text-[#6a766f]">
                <span className="text-[0.78rem] uppercase tracking-[0.12em]">{item.label}</span>
                <item.icon className="h-4 w-4" />
              </div>
              <strong className="text-[1.85rem] font-semibold leading-none text-[#334039]">{item.value}</strong>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <Card className="rounded-2xl border-border/70 bg-white shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[1rem] font-semibold text-foreground">Pending jobs</CardTitle>
            <Link href="/admin/approvals" className="text-sm text-[#6f876f] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="grid gap-0 p-0">
            {snapshot.pending_approvals.length === 0 ? (
              <div className="px-6 py-6 text-sm text-[#6d7771]">No pending jobs.</div>
            ) : (
              snapshot.pending_approvals.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 border-t border-border/60 px-6 py-3 first:border-t-0"
                >
                  <strong className="line-clamp-1 font-medium text-[#334039]">{item.title}</strong>
                  <span className="text-xs text-[#7a847e]">{formatDateTime(item.requested_at)}</span>
                  {getPendingJobId(item.id) ? (
                    <div className="mt-0.5 flex items-center gap-2">
                      <Link
                        href={`/admin/jobs/${getPendingJobId(item.id)}?returnTo=${encodeURIComponent("/admin/approvals")}`}
                        className={cn(buttonVariants(), "h-8 rounded-lg px-3 text-xs")}
                      >
                        Review
                      </Link>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="inline-flex items-center gap-2 text-[1rem] font-semibold text-foreground">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {snapshot.notifications.length === 0 ? (
              <div className="rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(247,249,247,0.8)] px-4 py-4 text-sm text-[#6d7771]">
                No notifications.
              </div>
            ) : (
              snapshot.notifications.slice(0, 6).map((notification) => (
                <article
                  key={notification.id}
                  className="grid gap-1 rounded-xl border border-border/60 bg-[rgba(250,252,250,0.92)] px-4 py-2.5"
                >
                  <strong className="line-clamp-1 text-sm text-[#334039]">{notification.title}</strong>
                  <span className="text-[0.78rem] text-[#86918a]">{formatDateTime(notification.created_at)}</span>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
