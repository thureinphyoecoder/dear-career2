import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardSnapshot } from "@/lib/api-admin";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();
  const nextManualSource = snapshot.sources.find((source) => source.requires_manual_url);
  const healthySources = snapshot.sources.filter((source) => source.status === "healthy").length;
  const latestNotification = snapshot.notifications[0];
  const statItems = [
    ["Live jobs", snapshot.published_jobs],
    ["Pending review", snapshot.pending_approvals.length],
    ["Healthy sources", healthySources],
    ["Visitors", snapshot.total_visitors],
    ["Active ads", snapshot.active_ads],
  ] as const;

  return (
    <div className="grid max-w-[1120px] gap-6">
      <header className="flex justify-end">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/jobs/new" className={cn(buttonVariants(), "rounded-md")}>
            New job
          </Link>
          <Link
            href="/admin/approvals"
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
          >
            Approvals
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statItems.map(([label, value]) => (
          <Card
            key={label}
            className="rounded-2xl border-border/70 bg-white shadow-none"
          >
            <CardContent className="grid gap-1 p-5">
              <strong className="text-[1.9rem] font-semibold leading-none text-[#334039]">{value}</strong>
              <span className="text-[0.88rem] text-[#727975]">{label}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.9fr)]">
        <Card className="rounded-2xl border-border/70 bg-white shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
              Pending approvals
            </CardTitle>
            <Link href="/admin/jobs" className="text-[0.88rem] text-[#7f9582]">
              Jobs
            </Link>
          </CardHeader>
          <CardContent className="grid gap-0 p-0">
            {snapshot.pending_approvals.length === 0 ? (
              <p className="m-0 px-6 py-6 text-[0.92rem] text-[#727975]">No approvals waiting.</p>
            ) : (
              snapshot.pending_approvals.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="grid gap-1.5">
                    <strong className="font-medium text-[#334039]">{item.title}</strong>
                    <span className="text-[0.92rem] text-[#727975]">
                      {item.company} · {item.source_label}
                    </span>
                  </div>
                  <div className="grid gap-1 text-left sm:justify-items-end">
                    <span className="text-[0.92rem] capitalize text-[#727975]">
                      {item.requested_action.replace("-", " ")}
                    </span>
                    <Link href="/admin/jobs" className="text-[0.88rem] text-[#7f9582]">
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-2xl border-border/70 bg-white shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
                Sources
              </CardTitle>
              <Link href="/admin/sources" className="text-[0.88rem] text-[#7f9582]">
                Open
              </Link>
            </CardHeader>
            <CardContent className="grid gap-0">
              {snapshot.sources.slice(0, 4).map((source) => (
                <div
                  key={source.id}
                  className="flex flex-col gap-3 border-t border-border/60 py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="grid gap-1">
                    <strong className="font-medium text-[#334039]">{source.label}</strong>
                    <span className="text-[0.92rem] text-[#727975]">
                      {source.requires_manual_url
                        ? "Manual URL intake"
                        : `Every ${source.cadence_value} ${source.cadence_unit}`}
                    </span>
                  </div>
                  <div className="grid gap-1 text-left sm:justify-items-end">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.12em]",
                        {
                          "border-[rgba(76,145,118,0.22)] bg-[rgba(76,145,118,0.14)] text-[#246245]":
                            source.status === "healthy",
                          "border-[rgba(204,165,92,0.22)] bg-[rgba(204,165,92,0.16)] text-[#8a6120]":
                            source.status === "warning",
                          "border-[rgba(114,121,117,0.22)] bg-[rgba(114,121,117,0.16)] text-[#59605d]":
                            source.status === "paused",
                        },
                      )}
                    >
                      {source.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-2xl border-border/70 bg-white shadow-none">
              <CardContent className="grid gap-1 p-5">
                <strong className="font-medium text-[#334039]">
                  {nextManualSource ? nextManualSource.label : "No manual source"}
                </strong>
                <span className="text-[0.9rem] text-[#727975]">Manual intake</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 bg-white shadow-none">
              <CardContent className="grid gap-1 p-5">
                <strong className="font-medium text-[#334039]">
                  {latestNotification?.title ?? "No signal"}
                </strong>
                <span className="text-[0.9rem] text-[#727975]">
                  {latestNotification?.detail ?? "No recent activity."}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
