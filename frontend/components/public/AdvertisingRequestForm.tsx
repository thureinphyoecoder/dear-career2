"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isValidEmail, normalizeServerError } from "@/lib/form-validation";

type FormState = {
  name: string;
  email: string;
  company: string;
  placement: string;
  budget: string;
  timeline: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  company: "",
  placement: "",
  budget: "",
  timeline: "",
  message: "",
};

export function AdvertisingRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.company.trim() || !form.placement.trim() || !form.message.trim()) {
      const next = "Please fill all required fields.";
      setStatus("error");
      setMessage(next);
      toast.error(next);
      return;
    }

    if (!isValidEmail(form.email)) {
      const next = "Enter a valid email address.";
      setStatus("error");
      setMessage(next);
      toast.error(next);
      return;
    }

    setStatus("submitting");
    setMessage("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: `Advertising Inquiry - ${form.company.trim()}`,
      message: [
        `Company: ${form.company.trim()}`,
        `Preferred placement: ${form.placement.trim()}`,
        `Budget range: ${form.budget.trim() || "-"}`,
        `Timeline: ${form.timeline.trim() || "-"}`,
        "",
        form.message.trim(),
      ].join("\n"),
    };

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { detail?: string };

      if (!response.ok) {
        const next = normalizeServerError(data.detail ?? "", "Unable to send advertising request right now.");
        setStatus("error");
        setMessage(next);
        toast.error(next);
        return;
      }

      const next = data.detail ?? "Advertising request received.";
      setStatus("success");
      setMessage(next);
      toast.success(next);
      setForm(initialState);
    } catch {
      const next = "Unable to send advertising request right now.";
      setStatus("error");
      setMessage(next);
      toast.error(next);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Contact Name *</span>
          <Input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your name"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Email *</span>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@company.com"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Company *</span>
          <Input
            value={form.company}
            onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
            placeholder="Company name"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Preferred Placement *</span>
          <Input
            value={form.placement}
            onChange={(event) => setForm((current) => ({ ...current, placement: event.target.value }))}
            placeholder="Home Hero / Jobs Inline / Job Detail"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Budget Range</span>
          <Input
            value={form.budget}
            onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
            placeholder="e.g. THB 15,000 - 25,000"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Campaign Timeline</span>
          <Input
            value={form.timeline}
            onChange={(event) => setForm((current) => ({ ...current, timeline: event.target.value }))}
            placeholder="e.g. 2 weeks"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Campaign Details *</span>
        <Textarea
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder="Target audience, goals, and any notes."
          required
        />
      </label>

      {message ? (
        <div
          className={
            status === "success"
              ? "rounded-[1.2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(221,232,223,0.44)] px-4 py-3 text-sm text-[#4a6250]"
              : "rounded-[1.2rem] border border-[rgba(205,111,111,0.18)] bg-[rgba(205,111,111,0.08)] px-4 py-3 text-sm text-[#8e4a4a]"
          }
        >
          {message}
        </div>
      ) : null}

      <div className="flex justify-start">
        <Button type="submit" size="lg" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : "Start Advertising Request"}
        </Button>
      </div>
      <p className="m-0 text-xs leading-6 text-[#727975]">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </a>
        .
      </p>
    </form>
  );
}
