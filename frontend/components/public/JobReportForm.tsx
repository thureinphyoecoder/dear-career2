"use client";

import { AlertTriangle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeServerError } from "@/lib/form-validation";
import type { JobReportReason } from "@/lib/types";

type FormState = {
  reason: JobReportReason;
  name: string;
  email: string;
  message: string;
};

const initialState: FormState = {
  reason: "inaccurate",
  name: "",
  email: "",
  message: "",
};

const reasonLabelMap: Record<JobReportReason, string> = {
  scam: "Scam or fake job",
  inaccurate: "Inaccurate information",
  expired: "Expired or closed role",
  duplicate: "Duplicate posting",
  other: "Other",
};

export function JobReportForm({ jobId }: { jobId: number }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/report-job", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobId,
          reason: form.reason,
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as { detail?: string };
      if (!response.ok) {
        const detail = payload.detail ?? "";
        const nextMessage = normalizeServerError(detail, "Unable to submit report right now.");
        setStatus("error");
        setMessage(nextMessage);
        toast.error(nextMessage);
        return;
      }

      const nextMessage = payload.detail ?? "Report received. Admin has been notified.";
      setStatus("success");
      setMessage(nextMessage);
      toast.success(nextMessage);
      setForm(initialState);
    } catch {
      const nextMessage = "Unable to submit report right now.";
      setStatus("error");
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  return (
    <section className="grid gap-3 rounded-[1.75rem] border border-[rgba(190,126,126,0.2)] bg-[linear-gradient(165deg,rgba(255,253,252,0.9),rgba(254,244,244,0.72))] p-5 shadow-[0_16px_34px_rgba(188,127,127,0.08)]">
      <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#9d6f6f]">
        <AlertTriangle className="h-4 w-4" />
        Report to admin
      </div>
      <p className="m-0 text-sm leading-6 text-[#6a5d5d]">
        If this posting looks suspicious, outdated, or incorrect, send a quick report.
      </p>

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#8b7373]">Reason</span>
          <select
            className="h-10 w-full rounded-xl border border-[rgba(190,126,126,0.28)] bg-white/85 px-3 text-sm text-[#3f3a3a] outline-none focus:border-[rgba(155,96,96,0.6)]"
            value={form.reason}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reason: event.target.value as JobReportReason,
              }))
            }
          >
            {Object.entries(reasonLabelMap).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#8b7373]">Name (optional)</span>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Your name"
              className="h-10 rounded-xl border-[rgba(190,126,126,0.28)] bg-white/85"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs uppercase tracking-[0.14em] text-[#8b7373]">Email (optional)</span>
            <Input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="you@example.com"
              className="h-10 rounded-xl border-[rgba(190,126,126,0.28)] bg-white/85"
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#8b7373]">Note (optional)</span>
          <Textarea
            value={form.message}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
            placeholder="Explain what is wrong with this listing"
            className="min-h-[92px] rounded-xl border-[rgba(190,126,126,0.28)] bg-white/85"
          />
        </label>

        {message ? (
          <div
            className={
              status === "success"
                ? "rounded-xl border border-[rgba(115,157,115,0.28)] bg-[rgba(221,242,221,0.56)] px-3 py-2 text-sm text-[#3f6140]"
                : "rounded-xl border border-[rgba(190,126,126,0.34)] bg-[rgba(245,214,214,0.45)] px-3 py-2 text-sm text-[#8a4d4d]"
            }
          >
            {message}
          </div>
        ) : null}

        <Button
          type="submit"
          size="sm"
          disabled={status === "submitting"}
          className="w-fit rounded-full bg-[#986767] px-4 text-white hover:bg-[#865a5a]"
        >
          <Send className="mr-1 h-4 w-4" />
          {status === "submitting" ? "Sending..." : "Send report"}
        </Button>
      </form>
    </section>
  );
}
