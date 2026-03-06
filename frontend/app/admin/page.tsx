import Link from "next/link";
import { Bell, Clock3, Database, FileClock, Globe, ShieldCheck } from "lucide-react";

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

const toneClassMap = {
  info: "border-[rgba(123,148,167,0.26)] bg-[rgba(123,148,167,0.1)] text-[#4a6677]",
  success: "border-[rgba(98,152,116,0.24)] bg-[rgba(98,152,116,0.1)] text-[#2f6341]",
  warning: "border-[rgba(196,149,88,0.3)] bg-[rgba(196,149,88,0.12)] text-[#7a5b2f]",
} as const;

function getPendingJobId(value: string) {
  const match = value.match(/(\d+)$/);
  return match?.[1] ?? "";
}

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();
  const visitorSummary = snapshot.visitor_summary;

  const statItems = [
    {
      label: "Live jobs",
      value: snapshot.published_jobs,
      detail: `${snapshot.total_jobs} total`,
      icon: ShieldCheck,
    },
    {
      label: "Pending approvals",
      value: snapshot.pending_approvals.length,
      detail: "Need review",
      icon: FileClock,
    },
    {
      label: "Sources",
      value: snapshot.source_count,
      detail: "Connected",
      icon: Database,
    },
    {
      label: "Visitors",
      value: snapshot.total_visitors,
      detail: `${visitorSummary?.today_visitors ?? 0} today`,
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.label} className="rounded-2xl border-border/70 bg-white shadow-none">
            <CardContent className="grid gap-2 p-5">
              <div className="inline-flex items-center justify-between gap-3 text-[#6a766f]">
                <span className="text-[0.78rem] uppercase tracking-[0.12em]">{item.label}</span>
                <item.icon className="h-4 w-4" />
              </div>
              <strong className="text-[2rem] font-semibold leading-none text-[#334039]">{item.value}</strong>
              <span className="text-[0.86rem] text-[#727975]">{item.detail}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <Card className="rounded-2xl border-border/70 bg-white shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[1rem] font-semibold text-foreground">Pending Approvals</CardTitle>
            <Link href="/admin/approvals" className="text-sm text-[#6f876f] hover:underline">
              Open queue
            </Link>
          </CardHeader>
          <CardContent className="grid gap-0 p-0">
            {snapshot.pending_approvals.length === 0 ? (
              <div className="px-6 py-8 text-sm text-[#6d7771]">No items waiting for approval.</div>
            ) : (
              snapshot.pending_approvals.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="grid gap-1 border-t border-border/60 px-6 py-4 first:border-t-0"
                >
                  <strong className="font-medium text-[#334039]">{item.title}</strong>
                  <span className="text-sm text-[#727975]">{item.company}</span>
                  <div className="flex flex-wrap items-center gap-2 text-[0.8rem] text-[#7a847e]">
                    <span className="rounded-full border border-[rgba(141,166,147,0.2)] px-2.5 py-0.5 uppercase tracking-[0.08em]">
                      {item.requested_action.replace("-", " ")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDateTime(item.requested_at)}
                    </span>
                  </div>
                  {getPendingJobId(item.id) ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Link
                        href={`/admin/jobs/${getPendingJobId(item.id)}?returnTo=${encodeURIComponent("/admin/approvals")}`}
                        className={cn(buttonVariants({ variant: "secondary" }), "h-8 rounded-lg px-3 text-xs")}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/jobs/${getPendingJobId(item.id)}?returnTo=${encodeURIComponent("/admin/approvals")}`}
                        className={cn(buttonVariants(), "h-8 rounded-lg px-3 text-xs")}
                      >
                        Edit
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
          <CardContent className="grid gap-3">
            {snapshot.notifications.length === 0 ? (
              <div className="rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(247,249,247,0.8)] px-4 py-6 text-sm text-[#6d7771]">
                No notifications.
              </div>
            ) : (
              snapshot.notifications.slice(0, 6).map((notification) => (
                <article
                  key={notification.id}
                  className="grid gap-1 rounded-xl border border-border/60 bg-[rgba(250,252,250,0.92)] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-[#334039]">{notification.title}</strong>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.1em]",
                        toneClassMap[notification.tone],
                      )}
                    >
                      {notification.tone}
                    </span>
                  </div>
                  <p className="m-0 text-sm leading-6 text-[#68726c]">{notification.detail}</p>
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
