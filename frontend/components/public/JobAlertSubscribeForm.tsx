"use client";

import { useState, type FormEvent } from "react";
import { Bell, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, normalizeServerError } from "@/lib/form-validation";
import { trackLeadConversion } from "@/lib/tracking";

type Props = {
  source?: string;
};

export function JobAlertSubscribeForm({ source = "public-nav" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!isValidEmail(trimmed)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/job-alert/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, source }),
      });
      const payload = (await response.json()) as { detail?: string };

      if (!response.ok) {
        const detail = payload.detail ?? "";
        setStatus("error");
        setMessage(normalizeServerError(detail, "Unable to subscribe right now."));
        return;
      }

      setStatus("success");
      setMessage(payload.detail ?? "Subscribed to job alerts.");
      trackLeadConversion("job_alert_subscribe");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Unable to subscribe right now.");
    }
  }

  return (
    <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
      <label className="grid gap-1">
        <span className="text-xs uppercase tracking-[0.14em] text-[#7f9685]">Email Subscribe</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          required
        />
      </label>
      <div className="flex items-end">
        <Button type="submit" className="h-10 w-full sm:w-auto" disabled={status === "submitting"}>
          {status === "submitting" ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>
      {message ? (
        <div
          className={
            status === "success"
              ? "sm:col-span-2 flex items-center gap-2 rounded-xl border border-[rgba(160,183,164,0.2)] bg-[rgba(221,232,223,0.42)] px-3 py-2 text-sm text-[#4a6250]"
              : "sm:col-span-2 rounded-xl border border-[rgba(205,111,111,0.18)] bg-[rgba(205,111,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]"
          }
        >
          {status === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Bell className="h-4 w-4 shrink-0" />}
          <span>{message}</span>
        </div>
      ) : null}
    </form>
  );
}
