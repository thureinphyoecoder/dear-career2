"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PencilLine, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { StatusPill } from "@/components/admin/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

function formatCategory(category: Job["category"]) {
  return category.replace("-", " ");
}

function formatDate(value?: string) {
  if (!value) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function JobTable({ jobs }: { jobs: Job[] }) {
  const [jobRows, setJobRows] = useState<Job[]>(jobs);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [pendingDeleteJob, setPendingDeleteJob] = useState<Job | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setJobRows(jobs);
  }, [jobs]);

  async function deleteJob() {
    if (!pendingDeleteJob) return;

    setDeletingId(pendingDeleteJob.id);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${pendingDeleteJob.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Could not remove this job.");
      }

      setJobRows((current) => current.filter((job) => job.id !== pendingDeleteJob.id));
      toast.success(`Removed ${pendingDeleteJob.title}.`);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Could not remove this job.";
      setActionError(nextError);
      toast.error(nextError);
    } finally {
      setDeletingId(null);
      setPendingDeleteJob(null);
    }
  }

  async function publishJob(job: Job) {
    setPublishingId(job.id);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: "published",
          is_active: true,
          requires_website_approval: false,
          requires_facebook_approval: false,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Could not make this job live.");
      }

      const updated = (await response.json()) as Job;
      setJobRows((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      toast.success(`${updated.title} is now live and ready for Facebook posting.`);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Could not make this job live.";
      setActionError(nextError);
      toast.error(nextError);
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {actionError ? (
        <div className="rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-4 py-3 text-sm text-[#8e4a4a]">
          {actionError}
        </div>
      ) : null}

      <Card className="rounded-2xl border-border/70 bg-white shadow-none">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1080px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[48%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-[#fafbfa]">
              <tr>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Role</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Category</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Added from</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Job stage</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Updated</th>
                <th className="border-b border-border/70 px-5 py-3 text-right text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
            {jobRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-[0.92rem] text-[#727975]">
                  No jobs yet. Add one yourself or bring one in from a job link.
                </td>
              </tr>
            ) : (
              jobRows.map((job) => (
                <tr key={job.id} className="hover:bg-[#fafcfb]">
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <div className="grid min-w-0 gap-1">
                      <strong className="truncate font-medium text-[#334039]" title={job.title}>
                        {job.title}
                      </strong>
                      <span className="truncate text-[0.92rem] text-[#727975]" title={`${job.company} · ${job.location || "Thailand"}`}>
                        {job.company} · {job.location || "Thailand"}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top capitalize">
                    <span className="block truncate" title={formatCategory(job.category)}>
                      {formatCategory(job.category)}
                    </span>
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <span className="block truncate" title={job.source || "Added by hand"}>
                      {job.source || "Added by hand"}
                    </span>
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <StatusPill status={job.status ?? "published"} />
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <span className="block truncate" title={formatDate(job.updated_at ?? job.created_at)}>
                      {formatDate(job.updated_at ?? job.created_at)}
                    </span>
                  </td>
                  <td className="border-b border-border/60 px-4 py-4 align-top">
                    <div className="flex items-center justify-end gap-1.5">
                      {(job.status ?? "published") === "draft" ? (
                        <button
                          className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white text-[#4f6a57] transition-colors hover:border-[#8da693]/40 hover:bg-[#f3f7f4] hover:text-[#334039]"
                          type="button"
                          disabled={publishingId === job.id}
                          onClick={() => void publishJob(job)}
                        >
                          <Upload className="h-4 w-4" />
                          <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[#334039] px-2 py-1 text-[0.72rem] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                            {publishingId === job.id ? "Making live" : "Make live"}
                          </span>
                        </button>
                      ) : null}
                      <Link
                        className={cn(
                          "group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white text-[#6f7b73] transition-colors hover:border-[#8da693]/40 hover:bg-[#f3f7f4] hover:text-[#334039]",
                        )}
                        href={`/admin/jobs/${job.id}`}
                      >
                        <PencilLine className="h-4 w-4" />
                        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[#334039] px-2 py-1 text-[0.72rem] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          Open
                        </span>
                      </Link>
                      <button
                        className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white text-[#8e4a4a] transition-colors hover:border-[rgba(169,97,111,0.28)] hover:bg-[rgba(169,97,111,0.08)]"
                        type="button"
                        disabled={deletingId === job.id}
                        onClick={() => setPendingDeleteJob(job)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[#334039] px-2 py-1 text-[0.72rem] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          {deletingId === job.id ? "Removing" : "Remove"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <ConfirmModal
        open={Boolean(pendingDeleteJob)}
        title="Remove job"
        description={
          pendingDeleteJob
            ? `This will permanently remove "${pendingDeleteJob.title}" from your job list.`
            : ""
        }
        confirmLabel="Remove"
        isLoading={Boolean(pendingDeleteJob && deletingId === pendingDeleteJob.id)}
        onConfirm={() => void deleteJob()}
        onCancel={() => {
          if (deletingId) return;
          setPendingDeleteJob(null);
        }}
      />
    </div>
  );
}
