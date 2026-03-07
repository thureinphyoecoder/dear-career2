"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  SquarePen,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  validateFacebookPublishFields,
  type FacebookPublishFieldErrors,
} from "@/lib/admin-form-validation";
import { buildFacebookPostMessage, formatFacebookPostContent } from "@/lib/job-content";
import { adminQueryKeys } from "@/lib/admin-query-keys";
import { normalizeServerError } from "@/lib/form-validation";
import type { FacebookPagePost, Job } from "@/lib/types";
import { cn } from "@/lib/utils";

function normalizePostText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatPostTimestamp(value?: string) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function FacebookPublishPanel({
  jobs,
  posts,
}: {
  jobs: Job[];
  posts: FacebookPagePost[];
}) {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0] ? String(jobs[0].id) : "");
  const [message, setMessage] = useState<string>(jobs[0] ? buildFacebookPostMessage(jobs[0]) : "");
  const [messageDirty, setMessageDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastAttemptAt, setLastAttemptAt] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FacebookPublishFieldErrors>({});

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const selectedJobDefaultMessage = useMemo(
    () => (selectedJob ? buildFacebookPostMessage(selectedJob) : ""),
    [selectedJob],
  );
  const duplicatePost = useMemo(() => {
    const normalizedMessage = normalizePostText(message);
    if (!normalizedMessage) {
      return null;
    }

    return posts.find((post) => normalizePostText(post.message ?? "") === normalizedMessage) ?? null;
  }, [message, posts]);

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId("");
      setMessage("");
      setMessageDirty(false);
      return;
    }

    const selectedStillExists = jobs.some((job) => String(job.id) === selectedJobId);
    if (!selectedStillExists) {
      const firstJob = jobs[0];
      setSelectedJobId(String(firstJob.id));
      setMessage(buildFacebookPostMessage(firstJob));
      setMessageDirty(false);
    }
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJob) {
      return;
    }

    if (!messageDirty) {
      setMessage(selectedJobDefaultMessage);
    }
  }, [selectedJob, selectedJobDefaultMessage, messageDirty]);
  const publishMutation = useMutation({
    mutationFn: async (payload: { jobId: string; message: string }) => {
      const response = await fetch("/api/admin/proxy/jobs/admin/channels/facebook/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          job_id: payload.jobId,
          message: payload.message,
        }),
      });
      if (response.redirected || response.url.includes("/admin/login")) {
        throw new Error("Admin session expired. Please sign in again.");
      }

      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      const text = await response.text();
      if (!response.ok) {
        throw new Error(normalizeServerError(text, "Facebook publish failed."));
      }
      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected server response while posting to Facebook. Please try again.");
      }

      try {
        return JSON.parse(text) as { post_id?: string; permalink_url?: string; published?: boolean };
      } catch {
        throw new Error("Unable to read Facebook publish response.");
      }
    },
    onSuccess: (result) => {
      if (!result?.published) {
        throw new Error("Facebook publish did not complete.");
      }
      const postId = String(result?.post_id ?? "").trim();
      const permalinkUrl = String(result?.permalink_url ?? "").trim();
      const nextSuccess = permalinkUrl
        ? `Post published successfully. Open: ${permalinkUrl}`
        : postId
          ? `Post published successfully. Post ID: ${postId}`
          : "Post published to the connected Facebook page.";
      setSuccess(nextSuccess);
      setLastAttemptAt(new Date().toLocaleTimeString());
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.jobs });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.facebookCredential });
      toast.success(nextSuccess);
    },
    onError: (error) => {
      const nextError = error instanceof Error ? error.message : "Facebook publish failed. Try again.";
      setError(nextError);
      setLastAttemptAt(new Date().toLocaleTimeString());
      toast.error(nextError);
    },
  });

  function handleJobChange(nextId: string) {
    setSelectedJobId(nextId);
    const nextJob = jobs.find((job) => String(job.id) === nextId);
    if (nextJob) {
      setMessage(buildFacebookPostMessage(nextJob));
      setMessageDirty(false);
    }
    setError("");
    setSuccess("");
    setFieldErrors((current) => ({ ...current, selectedJobId: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const normalizedMessage = formatFacebookPostContent(message);
    setMessage(normalizedMessage);
    const nextFieldErrors = validateFacebookPublishFields({
      selectedJobId,
      message: normalizedMessage,
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      const nextError = "Please fix the Facebook post fields.";
      setError(nextError);
      toast.error(nextError);
      return;
    }

    setFieldErrors({});

    setSubmitting(true);
    setLastAttemptAt(new Date().toLocaleTimeString());
    try {
      await publishMutation.mutateAsync({
        jobId: selectedJobId,
        message: normalizedMessage,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
      <CardContent className="grid gap-4 p-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1">
            <label className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.16em] text-[#8da693]">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Job
            </label>
            <select
              className={cn(
                "h-11 rounded-xl border border-[rgba(160,183,164,0.24)] bg-white px-3 text-[0.95rem] text-[#334039] outline-none",
                fieldErrors.selectedJobId && "border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]",
              )}
              value={selectedJobId}
              onChange={(event) => handleJobChange(event.target.value)}
              aria-invalid={Boolean(fieldErrors.selectedJobId)}
            >
              <option value="">Choose a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.company}
                </option>
              ))}
            </select>
            {fieldErrors.selectedJobId ? (
              <span className="text-sm text-[#8e4a4a]">{fieldErrors.selectedJobId}</span>
            ) : null}
          </div>

          <div className="grid gap-1">
            <label className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.16em] text-[#8da693]">
              <FileText className="h-3.5 w-3.5" />
              Post
            </label>
            <textarea
              className={cn(
                "min-h-[180px] rounded-2xl border border-[rgba(160,183,164,0.24)] bg-white px-4 py-3 text-[0.95rem] leading-7 text-[#334039] outline-none",
                fieldErrors.message && "border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]",
              )}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setMessageDirty(true);
                if (fieldErrors.message) {
                  setFieldErrors((current) => ({ ...current, message: "" }));
                }
              }}
              onBlur={() => {
                const normalized = formatFacebookPostContent(message);
                if (normalized !== message) {
                  setMessage(normalized);
                }
              }}
              placeholder="Write the Facebook post content"
              aria-invalid={Boolean(fieldErrors.message)}
            />
            {fieldErrors.message ? (
              <span className="text-sm text-[#8e4a4a]">{fieldErrors.message}</span>
            ) : null}
          </div>

          {selectedJob ? (
            <div className="grid gap-2 text-[0.84rem] text-[#7a847e]">
              <div>
                Posting: <strong className="text-[#334039]">{selectedJob.title}</strong>
              </div>
              <div>
                <Link
                  href={`/admin/jobs/${selectedJob.id}?returnTo=${encodeURIComponent("/admin/facebook")}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.28)] bg-white px-2.5 py-1 text-[0.76rem] font-medium text-[#59665e] transition-colors hover:bg-[#f7faf7]"
                >
                  <SquarePen className="h-3.5 w-3.5" />
                  Edit job details
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 text-[0.78rem]">
                {selectedJob.employment_type ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.24)] bg-[rgba(244,248,245,0.9)] px-2.5 py-1 text-[#59665e]">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {selectedJob.employment_type.replace(/-/g, " ")}
                  </span>
                ) : null}
                {selectedJob.salary ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.24)] bg-[rgba(244,248,245,0.9)] px-2.5 py-1 text-[#59665e]">
                    <Banknote className="h-3.5 w-3.5" />
                    {selectedJob.salary}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {duplicatePost ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Duplicate warning: the same post content already exists on the connected page
                {duplicatePost.created_time
                  ? ` (${formatPostTimestamp(duplicatePost.created_time)})`
                  : ""}
                .
              </span>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}

          {submitting ? (
            <div className="rounded-md border border-[rgba(124,141,130,0.24)] bg-[rgba(244,248,245,0.88)] px-3 py-2 text-sm text-[#59665e]">
              Posting to Facebook...
            </div>
          ) : null}

          {lastAttemptAt ? (
            <div className="text-xs text-[#7a847e]">Last attempt: {lastAttemptAt}</div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className={cn(buttonVariants(), "rounded-xl")}
              disabled={submitting || !selectedJobId}
            >
              <Send className="h-4 w-4" />
              {submitting ? "Posting..." : "Post to Facebook"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
