"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isValidEmail, normalizeServerError } from "@/lib/form-validation";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function FeedbackForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function validateForm(nextForm: FormState) {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!nextForm.name.trim()) nextErrors.name = "Enter your name.";
    if (!nextForm.email.trim()) nextErrors.email = "Enter your email address.";
    else if (!isValidEmail(nextForm.email)) nextErrors.email = "Enter a valid email address.";
    if (!nextForm.subject.trim()) nextErrors.subject = "Enter a subject.";
    if (!nextForm.message.trim()) nextErrors.message = "Write your feedback.";
    else if (nextForm.message.trim().length < 10) nextErrors.message = "Add a bit more detail.";

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setMessage("Please fix the highlighted fields and try again.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { detail?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(normalizeServerError(payload.detail ?? "", "Unable to send feedback right now."));
        return;
      }

      setStatus("success");
      setMessage(payload.detail ?? "Feedback received.");
      setForm(initialState);
      setFieldErrors({});
    } catch {
      setStatus("error");
      setMessage("Unable to send feedback right now.");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Name</span>
          <Input
            value={form.name}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, name: value }));
              if (fieldErrors.name) {
                setFieldErrors((current) => ({ ...current, name: value.trim() ? "" : "Enter your name." }));
              }
            }}
            placeholder="Your name"
            required
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.name}</span> : null}
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Email</span>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, email: value }));
              if (fieldErrors.email) {
                setFieldErrors((current) => ({
                  ...current,
                  email: !value.trim()
                    ? "Enter your email address."
                    : isValidEmail(value)
                      ? ""
                      : "Enter a valid email address.",
                }));
              }
            }}
            placeholder="you@example.com"
            required
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.email}</span> : null}
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Subject</span>
        <Input
          value={form.subject}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, subject: value }));
            if (fieldErrors.subject) {
              setFieldErrors((current) => ({ ...current, subject: value.trim() ? "" : "Enter a subject." }));
            }
          }}
          placeholder="Bug, suggestion, broken link"
          required
          aria-invalid={Boolean(fieldErrors.subject)}
        />
        {fieldErrors.subject ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.subject}</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Message</span>
        <Textarea
          value={form.message}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, message: value }));
            if (fieldErrors.message) {
              setFieldErrors((current) => ({
                ...current,
                message: !value.trim() ? "Write your feedback." : value.trim().length < 10 ? "Add a bit more detail." : "",
              }));
            }
          }}
          placeholder="Write your feedback here"
          required
          aria-invalid={Boolean(fieldErrors.message)}
        />
        {fieldErrors.message ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.message}</span> : null}
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
          {status === "submitting" ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
