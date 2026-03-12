"use client";

import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
const STATUS_LABEL: Record<JobReportStatus, string> = {
  open: "Open",
  reviewed: "Reviewed",
  resolved: "Handled",
};
const REPORTS_REFRESH_INTERVAL_MS = 12000;
type ReportFilter = "all" | JobReportStatus;

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("open");
  const isMountedRef = useRef(true);

  const openReportsCount = useMemo(
    () => reports.filter((report) => report.status === "open").length,
    [reports],
  );
  const handledReportsCount = useMemo(
    () => reports.filter((report) => report.status === "resolved").length,
    [reports],
  );
  const filteredReports = useMemo(
    () => (activeFilter === "all" ? reports : reports.filter((report) => report.status === activeFilter)),
    [activeFilter, reports],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    async function refreshReports() {
      if (workingId !== null) {
        return;
      }

      setIsRefreshing(true);
      try {
        const payload = await requestAdmin<{ count: number; results: JobReport[] }>(
          "/api/admin/proxy/jobs/admin/reports/?limit=200",
          {
            fallbackError: "Could not refresh reports.",
          },
        );
        if (isMountedRef.current) {
          setReports(payload.results);
        }
      } catch {
        // Keep the previous list and retry on the next interval.
      } finally {
        if (isMountedRef.current) {
          setIsRefreshing(false);
        }
      }
    }

    void refreshReports();
    refreshTimer = setInterval(() => {
      void refreshReports();
    }, REPORTS_REFRESH_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshReports();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [workingId]);

  async function updateReportStatus(report: JobReport, status: JobReportStatus) {
    if (report.status === status) {
      return;
    }
    setWorkingId(report.id);
    try {
      const updated = await requestAdmin<JobReport>(
        `/api/admin/proxy/jobs/admin/reports/${report.id}/`,
        {
          method: "PATCH",
          json: { status },
          fallbackError: "Could not update this report.",
        },
      );

      setReports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(`Report marked as ${STATUS_LABEL[status].toLowerCase()}.`);
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
          <strong className="text-sm">Reports to check: {openReportsCount}</strong>
        </div>
        <span className="text-xs uppercase tracking-[0.14em] text-[#8da693]">
          {isRefreshing ? "Syncing..." : "Live updates"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "open" as ReportFilter, label: `Open (${openReportsCount})` },
          { key: "resolved" as ReportFilter, label: `Handled (${handledReportsCount})` },
          { key: "all" as ReportFilter, label: `All (${reports.length})` },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveFilter(item.key)}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors",
              activeFilter === item.key
                ? "border-[rgba(116,141,122,0.34)] bg-[rgba(144,168,147,0.14)] text-[#3b5645]"
                : "border-[rgba(160,183,164,0.2)] bg-white text-[#617068] hover:bg-[rgba(144,168,147,0.08)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <div className="rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.88)] px-4 py-6 text-sm text-[#6b756f]">
          No reports in this filter.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredReports.map((report) => (
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
                  {report.status === "resolved" ? "handled" : report.status}
                </span>
                {report.reporter_email ? (
                  <span className="text-[#6d7a72]">{report.reporter_email}</span>
                ) : null}
              </div>

              {report.message ? (
                <p className="m-0 text-sm leading-6 text-[#4b5a52]">{report.message}</p>
              ) : null}
              {report.review_note ? (
                <p className="m-0 rounded-md bg-[rgba(144,168,147,0.08)] px-3 py-2 text-sm text-[#3f4f47]">
                  Note: {report.review_note}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {report.status !== "resolved" ? (
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border border-[rgba(116,141,122,0.28)] bg-[rgba(144,168,147,0.1)] px-3 py-1.5 text-xs text-[#3d5746]",
                      workingId === report.id && "opacity-60",
                    )}
                    disabled={workingId === report.id}
                    onClick={() => void updateReportStatus(report, "resolved")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark as handled
                  </button>
                ) : null}
                {report.job_id ? (
                  <a
                    href={`/admin/jobs/${report.job_id}?returnTo=/admin/reports`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.24)] bg-white px-3 py-1.5 text-xs text-[#4b5a52]"
                  >
                    Open job
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
