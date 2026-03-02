"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";

function buildDefaultMessage(job: Job) {
  const lines = [job.title, `${job.company} · ${job.location}`];
  const summary = (job.description_en || job.description_mm || "").trim();
  if (summary) {
    lines.push(summary.slice(0, 280).trim());
  }
  if (job.source_url) {
    lines.push(job.source_url);
  }
  return lines.filter(Boolean).join("\n\n");
}

export function FacebookPublishPanel({ jobs }: { jobs: Job[] }) {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0] ? String(jobs[0].id) : "");
  const [message, setMessage] = useState<string>(jobs[0] ? buildDefaultMessage(jobs[0]) : "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  function handleJobChange(nextId: string) {
    setSelectedJobId(nextId);
    const nextJob = jobs.find((job) => String(job.id) === nextId);
    if (nextJob) {
      setMessage(buildDefaultMessage(nextJob));
    }
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedJobId) {
      const nextError = "Choose a published job first.";
      setError(nextError);
      toast.error(nextError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/channels/facebook/publish/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          job_id: selectedJobId,
          message,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        const nextError = text || "Facebook publish failed.";
        setError(nextError);
        toast.error(nextError);
        return;
      }

      const nextSuccess = "Post published to the connected Facebook page.";
      setSuccess(nextSuccess);
      toast.success(nextSuccess);
    } catch {
      const nextError = "Facebook publish failed. Try again.";
      setError(nextError);
      toast.error(nextError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
      <CardContent className="grid gap-4 p-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1">
            <label className="text-[0.76rem] uppercase tracking-[0.16em] text-[#8da693]">Job</label>
            <select
              className="h-11 rounded-xl border border-[rgba(160,183,164,0.24)] bg-white px-3 text-[0.95rem] text-[#334039] outline-none"
              value={selectedJobId}
              onChange={(event) => handleJobChange(event.target.value)}
            >
              <option value="">Choose a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.company}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-[0.76rem] uppercase tracking-[0.16em] text-[#8da693]">Post</label>
            <textarea
              className="min-h-[180px] rounded-2xl border border-[rgba(160,183,164,0.24)] bg-white px-4 py-3 text-[0.95rem] leading-7 text-[#334039] outline-none"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the Facebook post content"
            />
          </div>

          {selectedJob ? (
            <div className="text-[0.84rem] text-[#7a847e]">
              Posting: <strong className="text-[#334039]">{selectedJob.title}</strong>
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
