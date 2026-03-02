import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { getAdminDashboardSnapshot } from "@/lib/api-admin";

export default async function AdminApprovalsPage() {
  const snapshot = await getAdminDashboardSnapshot();

  return (
    <div className="grid max-w-[1120px] gap-6">
      <header className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Approvals</div>
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          Approvals
        </h1>
        <p className="max-w-[48ch] text-[0.92rem] leading-6 text-[#727975]">
          Review items waiting for website or Facebook publishing approval.
        </p>
      </header>

      <Card className="rounded-2xl border-border/70 bg-white shadow-none">
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
                    Open jobs
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
