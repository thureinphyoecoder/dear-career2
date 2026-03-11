"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeServerError } from "@/lib/form-validation";
import {
  mapFeedbackServerErrors,
  validateFeedbackFormFields,
  type FeedbackFormFieldErrors,
} from "@/lib/public-form-validation";

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
  const [fieldErrors, setFieldErrors] = useState<FeedbackFormFieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function clearFieldError<K extends keyof FormState>(field: K, value: FormState[K]) {
    if (!fieldErrors[field]) return;
    const nextErrors = validateFeedbackFormFields({
      ...form,
      [field]: value,
    });
    setFieldErrors((current) => ({
      ...current,
      [field]: nextErrors[field] ?? "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateFeedbackFormFields(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      const nextMessage = "Please fix the highlighted fields and try again.";
      setMessage(nextMessage);
      toast.error(nextMessage);
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
        const detail = payload.detail ?? "";
        const mappedServerErrors = mapFeedbackServerErrors(detail);
        if (Object.keys(mappedServerErrors).length > 0) {
          setFieldErrors((current) => ({
            ...current,
            ...mappedServerErrors,
          }));
        }
        const nextMessage = normalizeServerError(detail, "Unable to send feedback right now.");
        setMessage(nextMessage);
        toast.error(nextMessage);
        return;
      }

      setStatus("success");
      const nextMessage = payload.detail ?? "Feedback received.";
      setMessage(nextMessage);
      toast.success(nextMessage);
      setForm(initialState);
      setFieldErrors({});
    } catch {
      setStatus("error");
      const nextMessage = "Unable to send feedback right now.";
      setMessage(nextMessage);
      toast.error(nextMessage);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Name</span>
          <Input
            value={form.name}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, name: value }));
              clearFieldError("name", value);
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
              clearFieldError("email", value);
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
            clearFieldError("subject", value);
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
            clearFieldError("message", value);
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
