"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        setMessage(payload.detail ?? "Unable to send feedback right now.");
        return;
      }

      setStatus("success");
      setMessage(payload.detail ?? "Feedback received.");
      setForm(initialState);
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
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your name"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Email</span>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
            required
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Subject</span>
        <Input
          value={form.subject}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
          placeholder="Bug, suggestion, broken link"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Message</span>
        <Textarea
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder="Write your feedback here"
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
          {status === "submitting" ? "Sending..." : "Send feedback"}
        </Button>
      </div>
    </form>
  );
}
