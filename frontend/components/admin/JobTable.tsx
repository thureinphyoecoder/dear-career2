"use client";

import Link from "next/link";
import { useState } from "react";
import { PencilLine, Trash2 } from "lucide-react";
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
  }).format(new Date(value));
}

export function JobTable({ jobs }: { jobs: Job[] }) {
  const [jobRows, setJobRows] = useState<Job[]>(jobs);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteJob, setPendingDeleteJob] = useState<Job | null>(null);
  const [actionError, setActionError] = useState("");

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
        throw new Error(detail || "Unable to delete job.");
      }

      setJobRows((current) => current.filter((job) => job.id !== pendingDeleteJob.id));
      toast.success(`Deleted ${pendingDeleteJob.title}.`);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to delete job.";
      setActionError(nextError);
      toast.error(nextError);
    } finally {
      setDeletingId(null);
      setPendingDeleteJob(null);
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
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#fafbfa]">
              <tr>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Role</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Category</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Source</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Status</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Updated</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]" />
              </tr>
            </thead>
            <tbody>
            {jobRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-[0.92rem] text-[#727975]">
                  No jobs yet. Create a listing or queue a fetch source first.
                </td>
              </tr>
            ) : (
              jobRows.map((job) => (
                <tr key={job.id} className="hover:bg-[#fafcfb]">
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <div className="grid gap-1">
                      <strong className="font-medium text-[#334039]">{job.title}</strong>
                      <span className="text-[0.92rem] text-[#727975]">
                        {job.company} · {job.location || "Thailand"}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top capitalize">{formatCategory(job.category)}</td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">{job.source || "manual"}</td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <StatusPill status={job.status ?? "published"} />
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">{formatDate(job.updated_at ?? job.created_at)}</td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        className={cn(
                          "group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-white text-[#6f7b73] transition-colors hover:border-[#8da693]/40 hover:bg-[#f3f7f4] hover:text-[#334039]",
                        )}
                        href={`/admin/jobs/${job.id}`}
                      >
                        <PencilLine className="h-4 w-4" />
                        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-[#334039] px-2 py-1 text-[0.72rem] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          Edit
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
                          {deletingId === job.id ? "Deleting" : "Delete"}
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
        title="Delete job"
        description={
          pendingDeleteJob
            ? `This will permanently remove "${pendingDeleteJob.title}" from the admin list.`
            : ""
        }
        confirmLabel="Delete"
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
