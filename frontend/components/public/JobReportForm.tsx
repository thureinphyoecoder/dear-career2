"use client";

import { Send } from "lucide-react";
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

export function JobReportForm({
  jobId,
  compact = false,
  onSubmitted,
}: {
  jobId: number;
  compact?: boolean;
  onSubmitted?: () => void;
}) {
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
      onSubmitted?.();
    } catch {
      const nextMessage = "Unable to submit report right now.";
      setStatus("error");
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#7f9685]">Reason</span>
          <select
            className="h-11 w-full rounded-xl border border-[rgba(160,183,164,0.24)] bg-white/90 px-3 text-sm text-[#3f4b45] outline-none focus:border-[rgba(116,141,122,0.52)]"
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
          <span className="text-xs uppercase tracking-[0.14em] text-[#7f9685]">Name (optional)</span>
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Your name"
            className="h-11 rounded-xl border-[rgba(160,183,164,0.24)] bg-white/90"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs uppercase tracking-[0.14em] text-[#7f9685]">Email (optional)</span>
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
            className="h-11 rounded-xl border-[rgba(160,183,164,0.24)] bg-white/90"
          />
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className="text-xs uppercase tracking-[0.14em] text-[#7f9685]">Note (optional)</span>
        <Textarea
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              message: event.target.value,
            }))
          }
          placeholder="Explain what is wrong with this listing"
          className="min-h-[110px] rounded-xl border-[rgba(160,183,164,0.24)] bg-white/90"
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
        className={
          compact
            ? "w-full rounded-full bg-[#748d7a] px-4 text-white hover:bg-[#647a69]"
            : "w-fit rounded-full bg-[#748d7a] px-4 text-white hover:bg-[#647a69]"
        }
      >
        <Send className="mr-1 h-4 w-4" />
        {status === "submitting" ? "Sending..." : "Send report"}
      </Button>
    </form>
  );
}
