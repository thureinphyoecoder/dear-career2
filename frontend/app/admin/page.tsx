import Link from "next/link";

import { getAdminDashboardSnapshot } from "@/lib/api-admin";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();
  const nextManualSource = snapshot.sources.find((source) => source.requires_manual_url);
  const healthySources = snapshot.sources.filter((source) => source.status === "healthy").length;
  const latestNotification = snapshot.notifications[0];

  return (
    <div className="grid max-w-[980px] gap-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-2">
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Admin dashboard</div>
          <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
            Operations
          </h1>
          <p className="max-w-[48ch] text-[0.92rem] leading-6 text-[#727975]">
            Review intake, approve listings, and manage source cadence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/jobs/new" className={buttonVariants()}>
            New job
          </Link>
          <Link href="/admin/sources" className={buttonVariants({ variant: "secondary" })}>
            Fetch settings
          </Link>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ["Live jobs", snapshot.published_jobs, `${snapshot.total_jobs} total listings`],
          ["Pending review", snapshot.pending_approvals.length, "Website and Facebook queue"],
          ["Healthy sources", healthySources, `${snapshot.sources.length} configured sources`],
        ].map(([label, value, meta]) => (
          <Card key={String(label)} className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
            <CardContent className="grid gap-2 p-4">
              <span className="text-[0.72rem] uppercase tracking-[0.14em] text-[#727975]">{label}</span>
              <strong className="text-[1.8rem] leading-[0.95] text-foreground">{value}</strong>
              <span className="text-[0.92rem] text-[#727975]">{meta}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Review queue</div>
                <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Pending approvals</h2>
              </div>
              <Link href="/admin/jobs" className="text-[0.88rem] text-[#8da693]">
                Open jobs
              </Link>
            </div>
            <div className="grid">
            {snapshot.pending_approvals.length === 0 ? (
              <p className="m-0 text-[0.92rem] text-[#727975]">
                No approvals waiting.
              </p>
            ) : (
              snapshot.pending_approvals.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 border-t border-[rgba(160,183,164,0.14)] py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-1">
                    <strong>{item.title}</strong>
                    <span className="text-[0.92rem] text-[#727975]">
                      {item.company} · {item.source_label}
                    </span>
                  </div>
                  <div className="grid gap-1 text-left sm:justify-items-end">
                    <span className="text-[0.92rem] capitalize text-[#727975]">{item.requested_action.replace("-", " ")}</span>
                    <Link href="/admin/jobs" className="text-[0.88rem] text-[#8da693]">
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Fetch</div>
                <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Source status</h2>
              </div>
              <Link href="/admin/sources" className="text-[0.88rem] text-[#8da693]">
                Configure
              </Link>
            </div>
            <div className="grid">
            {snapshot.sources.slice(0, 4).map((source) => (
              <div key={source.id} className="flex flex-col gap-3 border-t border-[rgba(160,183,164,0.14)] py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-1">
                  <strong>{source.label}</strong>
                  <span className="text-[0.92rem] text-[#727975]">
                    {source.requires_manual_url
                      ? "Manual URL intake"
                      : `Every ${source.cadence_value} ${source.cadence_unit}`}
                  </span>
                </div>
                <div className="grid gap-1 text-left sm:justify-items-end">
                  <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.1em]", {
                    "border-[rgba(76,145,118,0.22)] bg-[rgba(76,145,118,0.14)] text-[#246245]": source.status === "healthy",
                    "border-[rgba(204,165,92,0.22)] bg-[rgba(204,165,92,0.16)] text-[#8a6120]": source.status === "warning",
                    "border-[rgba(114,121,117,0.22)] bg-[rgba(114,121,117,0.16)] text-[#59605d]": source.status === "paused",
                  })}>
                    {source.status}
                  </span>
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-2 p-5">
            <span className="text-[0.72rem] uppercase tracking-[0.14em] text-[#727975]">Manual intake</span>
            <strong>{nextManualSource ? nextManualSource.label : "No manual source"}</strong>
            <p className="m-0 text-[0.92rem] text-[#727975]">
            {nextManualSource
              ? "Use fetch settings when a site needs a pasted job URL."
              : "All current sources are crawler-based."}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-2 p-5">
            <span className="text-[0.72rem] uppercase tracking-[0.14em] text-[#727975]">Latest signal</span>
            <strong>{latestNotification?.title ?? "No signal"}</strong>
            <p className="m-0 text-[0.92rem] text-[#727975]">{latestNotification?.detail ?? "No recent activity."}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
