"use client";

import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { requestAdmin } from "@/lib/admin-client";
import type { JobReport, JobReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<JobReport["reason"], string> = {
  scam: "Scam / Fake",
  inaccurate: "Inaccurate info",
  expired: "Expired",
  duplicate: "Duplicate",
  other: "Other",
};

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export function ReportsQueue({ initialReports }: { initialReports: JobReport[] }) {
  const [reports, setReports] = useState(initialReports);
  const [workingId, setWorkingId] = useState<number | null>(null);

  const openReports = useMemo(
    () => reports.filter((report) => report.status === "open"),
    [reports],
  );

  async function updateStatus(report: JobReport, status: JobReportStatus) {
    setWorkingId(report.id);
    try {
      const updated = await requestAdmin<JobReport>(
        `/api/admin/proxy/jobs/admin/reports/${report.id}`,
        {
          method: "PATCH",
          json: { status },
          fallbackError: "Could not update this report.",
        },
      );

      setReports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Report updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this report.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.88)] px-4 py-3">
        <div className="inline-flex items-center gap-2 text-[#4c6354]">
          <ShieldAlert className="h-4 w-4" />
          <strong className="text-sm">Reports to check: {openReports.length}</strong>
        </div>
        <span className="text-xs uppercase tracking-[0.14em] text-[#8da693]">Review list</span>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.88)] px-4 py-6 text-sm text-[#6b756f]">
          No reports yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <article
              key={report.id}
              className={cn(
                "grid gap-3 rounded-xl border px-4 py-4",
                report.status === "open"
                  ? "border-[rgba(205,111,111,0.24)] bg-[rgba(205,111,111,0.06)]"
                  : "border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.9)]",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <strong className="text-sm text-[#334039]">{report.job_title}</strong>
                  <span className="text-sm text-[#64706a]">
                    {report.job_company || "Company name not available"}
                    {report.job_location ? ` · ${report.job_location}` : ""}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[#7f8a83]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatTime(report.created_at)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex rounded-full border border-[rgba(160,183,164,0.2)] px-2.5 py-1 uppercase tracking-[0.12em] text-[#55645b]">
                  {REASON_LABEL[report.reason]}
                </span>
                <span className="inline-flex rounded-full border border-[rgba(160,183,164,0.2)] px-2.5 py-1 uppercase tracking-[0.12em] text-[#55645b]">
                  {report.status}
                </span>
                {report.reporter_email ? (
                  <span className="text-[#6d7a72]">{report.reporter_email}</span>
                ) : null}
              </div>

              {report.message ? (
                <p className="m-0 text-sm leading-6 text-[#4b5a52]">{report.message}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                    (workingId === report.id || report.status !== "open") && "opacity-60",
                  )}
                  disabled={workingId === report.id || report.status !== "open"}
                  onClick={() => void updateStatus(report, "reviewed")}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Mark as checked
                </button>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-[rgba(116,141,122,0.28)] bg-[rgba(144,168,147,0.1)] px-3 py-1.5 text-xs text-[#3d5746]",
                    (workingId === report.id || report.status === "resolved") && "opacity-60",
                  )}
                  disabled={workingId === report.id || report.status === "resolved"}
                  onClick={() => void updateStatus(report, "resolved")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as solved
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
