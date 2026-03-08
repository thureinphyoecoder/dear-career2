"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requestAdmin } from "@/lib/admin-client";
import type { CvGuideContent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CvGuideEditor({ initialContent }: { initialContent: CvGuideContent | null }) {
  const [content, setContent] = useState<CvGuideContent>(() =>
    initialContent ?? {
      id: 0,
      key: "default",
      title: "CV Guide: Design Better, Write Clearer",
      intro: "Use this guide to build a clean CV that recruiters can scan quickly and trust.",
      guide_text: "",
    },
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveGuide() {
    if (!content.title.trim()) {
      setError("Title is required.");
      setMessage("");
      return;
    }
    if (!content.intro.trim()) {
      setError("Intro is required.");
      setMessage("");
      return;
    }
    if (!content.guide_text.trim()) {
      setError("Guide text is required.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await requestAdmin<CvGuideContent>("/api/admin/proxy/jobs/admin/cv-guide/", {
        method: "PATCH",
        json: {
          title: content.title,
          intro: content.intro,
          guide_text: content.guide_text,
        },
        fallbackError: "Could not update CV guide.",
      });
      setContent(updated);
      setMessage("CV guide updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update CV guide.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-border/70 bg-white p-5">
      <div className="grid gap-1">
        <h1 className="m-0 text-xl font-semibold text-[#334039]">CV Guide Content</h1>
        <p className="m-0 text-sm leading-7 text-[#68756d]">
          Public <strong>/cv-guide</strong> page content is managed here.
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Title</span>
        <Input
          value={content.title}
          onChange={(event) => setContent((current) => ({ ...current, title: event.target.value }))}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Intro</span>
        <Textarea
          value={content.intro}
          onChange={(event) => setContent((current) => ({ ...current, intro: event.target.value }))}
          className="min-h-[90px]"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Guide Text</span>
        <Textarea
          value={content.guide_text}
          onChange={(event) => setContent((current) => ({ ...current, guide_text: event.target.value }))}
          className="min-h-[460px] font-normal"
        />
      </label>

      {(error || message) ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
            error
              ? "border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] text-[#8e4a4a]"
              : "border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] text-[#4f6354]",
          )}
        >
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{error || message}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={cn(buttonVariants(), "rounded-md")}
          onClick={() => void saveGuide()}
          disabled={saving}
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save CV Guide"}
        </button>
      </div>
    </section>
  );
}
