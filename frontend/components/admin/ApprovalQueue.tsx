"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { normalizeServerError } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

const PAGE_SIZE = 10;
const VIEWED_STORAGE_KEY = "admin-pending-viewed-jobs";

function formatRequestedAction(job: Job) {
  const actions: string[] = [];
  if (job.requires_website_approval) actions.push("Website");
  if (job.requires_facebook_approval) actions.push("Facebook");
  return actions.length > 0 ? actions.join(" + ") : "Review";
}

function formatDate(value?: string) {
  if (!value) return "Not synced";
  return new Intl.DateTimeFormat("en-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ApprovalQueue({ jobs }: { jobs: Job[] }) {
  const [jobState, setJobState] = useState<Job[]>(jobs);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [pendingDeleteJob, setPendingDeleteJob] = useState<Job | null>(null);
  const [actionError, setActionError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewedJobIds, setViewedJobIds] = useState<number[]>([]);

  const orderedJobs = useMemo(
    () =>
      [...jobState].sort((left, right) =>
        new Date(right.updated_at ?? right.created_at ?? 0).getTime() -
        new Date(left.updated_at ?? left.created_at ?? 0).getTime(),
      ),
    [jobState],
  );
  const totalPages = Math.max(1, Math.ceil(orderedJobs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedJobs = orderedJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VIEWED_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setViewedJobIds(parsed.filter((value): value is number => typeof value === "number"));
      }
    } catch {
      // Ignore invalid local state and continue with a clean queue.
    }
  }, []);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  function persistViewed(nextViewedIds: number[]) {
    setViewedJobIds(nextViewedIds);
    window.localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(nextViewedIds));
  }

  function markViewed(jobId: number) {
    if (viewedJobIds.includes(jobId)) return;
    persistViewed([...viewedJobIds, jobId]);
  }

  function removeViewed(jobId: number) {
    if (!viewedJobIds.includes(jobId)) return;
    persistViewed(viewedJobIds.filter((id) => id !== jobId));
  }

  async function approveJob(job: Job) {
    setWorkingId(job.id);
    setActionError("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: "published",
          is_active: true,
          requires_website_approval: false,
          requires_facebook_approval: false,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to approve job."));
      }

      setJobState((current) => current.filter((item) => item.id !== job.id));
      removeViewed(job.id);
      toast.success(`Approved ${job.title}.`);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to approve job.";
      setActionError(nextError);
      toast.error(nextError);
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteJob() {
    if (!pendingDeleteJob) return;

    setWorkingId(pendingDeleteJob.id);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${pendingDeleteJob.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to delete job."));
      }

      setJobState((current) =>
        current.filter((item) => item.id !== pendingDeleteJob.id),
      );
      removeViewed(pendingDeleteJob.id);
      toast.success(`Deleted ${pendingDeleteJob.title}.`);
      setPendingDeleteJob(null);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to delete job.";
      setActionError(nextError);
      toast.error(nextError);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {actionError ? (
        <div className="rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-4 py-3 text-sm text-[#8e4a4a]">
          {actionError}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/70 bg-white shadow-none">
        {orderedJobs.length === 0 ? (
          <p className="m-0 px-6 py-6 text-[0.92rem] text-[#727975]">No approvals waiting.</p>
        ) : (
          <>
            {paginatedJobs.map((job, index) => {
              const isViewed = viewedJobIds.includes(job.id);

              return (
                <article
                  key={job.id}
                  className={cn(
                    "flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
                    index > 0 && "border-t border-border/60",
                    isViewed
                      ? "bg-white"
                      : "border-l-[3px] border-l-[#8da693] bg-[rgba(144,168,147,0.08)]",
                  )}
                >
                  <div className="grid gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-medium text-[#334039]">{job.title}</strong>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.12em]",
                          isViewed
                            ? "bg-[rgba(114,121,117,0.12)] text-[#66706a]"
                            : "bg-[rgba(116,141,122,0.16)] text-[#4f6354]",
                        )}
                      >
                        {isViewed ? "Viewed" : "Unviewed"}
                      </span>
                    </div>
                    <span className="text-[0.92rem] text-[#727975]">
                      {job.company} · {job.location || "Thailand"}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[0.82rem] text-[#7a847e]">
                      <span>{formatRequestedAction(job)}</span>
                      <span>{formatDate(job.updated_at ?? job.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      onClick={() => {
                        markViewed(job.id);
                        toast("Opening job details.");
                      }}
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "rounded-xl border-border/70 bg-white text-[#6f7b73] hover:bg-[#f3f7f4] hover:text-[#334039]",
                      )}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "rounded-xl border-[rgba(116,141,122,0.28)] bg-[rgba(144,168,147,0.08)] text-[#4f6354] hover:bg-[rgba(144,168,147,0.16)]",
                      )}
                      disabled={workingId === job.id}
                      onClick={() => void approveJob(job)}
                    >
                      <Check className="h-4 w-4" />
                      {workingId === job.id ? "Working..." : "Approve"}
                    </button>
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      onClick={() => {
                        markViewed(job.id);
                        toast("Opening editor.");
                      }}
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "rounded-xl border-border/70 bg-white text-[#6f7b73] hover:bg-[#f3f7f4] hover:text-[#334039]",
                      )}
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "rounded-xl border-border/70 bg-white text-[#8e4a4a] hover:border-[rgba(169,97,111,0.28)] hover:bg-[rgba(169,97,111,0.08)]",
                      )}
                      disabled={workingId === job.id}
                      onClick={() => setPendingDeleteJob(job)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}

            {orderedJobs.length > PAGE_SIZE ? (
              <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-[#727975]">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "rounded-xl",
                      safePage === 1 && "pointer-events-none opacity-50",
                    )}
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={cn(
                          buttonVariants(pageNumber === safePage ? {} : { variant: "secondary" }),
                          "min-w-10 rounded-xl px-0",
                        )}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "rounded-xl",
                      safePage === totalPages && "pointer-events-none opacity-50",
                    )}
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingDeleteJob)}
        title="Delete pending job"
        description={
          pendingDeleteJob
            ? `This will permanently remove "${pendingDeleteJob.title}" from the approval queue.`
            : ""
        }
        confirmLabel="Delete"
        isLoading={Boolean(pendingDeleteJob && workingId === pendingDeleteJob.id)}
        onConfirm={() => void deleteJob()}
        onCancel={() => {
          if (workingId) return;
          setPendingDeleteJob(null);
        }}
      />
    </div>
  );
}
