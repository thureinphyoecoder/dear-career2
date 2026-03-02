"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Link2, LoaderCircle, Plus, Settings2, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { isValidHttpUrl, normalizeServerError } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FetchSource } from "@/lib/types";

function formatSourceMode(source: FetchSource) {
  if (source.requires_manual_url) {
    return "Manual URL";
  }

  if (source.mode === "rss") {
    return "RSS";
  }

  return source.mode === "html" ? "HTML scraper" : "Manual";
}

export function SourceRegistry({ sources }: { sources: FetchSource[] }) {
  const router = useRouter();
  const [sourceState, setSourceState] = useState<Record<number, FetchSource>>(
    Object.fromEntries(sources.map((source) => [source.id, source])),
  );
  const [newSource, setNewSource] = useState({
    feed_url: "",
  });
  const [openSourceId, setOpenSourceId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [intakingId, setIntakingId] = useState<number | null>(null);
  const [targetDeleteId, setTargetDeleteId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [statusMessage, setStatusMessage] = useState<Record<number, string>>({});
  const [statusError, setStatusError] = useState<Record<number, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({});
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [manualIntakeUrls, setManualIntakeUrls] = useState<Record<number, string>>({});

  const orderedSources = useMemo(
    () => Object.values(sourceState).sort((left, right) => left.label.localeCompare(right.label)),
    [sourceState],
  );

  function updateSource(sourceId: number, patch: Partial<FetchSource>) {
    setSourceState((current) => ({
      ...current,
      [sourceId]: {
        ...current[sourceId],
        ...patch,
      },
    }));
  }

  function updateManualIntakeUrl(sourceId: number, value: string) {
    setManualIntakeUrls((current) => ({
      ...current,
      [sourceId]: value,
    }));
  }

  function validateSource(source: FetchSource) {
    const nextErrors: Record<string, string> = {};
    if (!source.label.trim()) nextErrors.label = "Enter a source label.";
    if (!source.domain.trim()) nextErrors.domain = "Enter a source domain.";
    if (source.feed_url && source.feed_url.trim() && !isValidHttpUrl(source.feed_url)) {
      nextErrors.feed_url = "Enter a valid feed URL.";
    }
    if (!Number.isFinite(source.cadence_value) || source.cadence_value < 0) {
      nextErrors.cadence_value = "Cadence must be zero or higher.";
    }
    if (!Number.isFinite(source.max_jobs_per_run ?? 0) || (source.max_jobs_per_run ?? 0) < 1) {
      nextErrors.max_jobs_per_run = "Max jobs per run must be at least 1.";
    }
    return nextErrors;
  }

  function validateNewSource() {
    const nextErrors: Record<string, string> = {};
    if (!newSource.feed_url.trim()) {
      nextErrors.feed_url = "Paste a source URL first.";
    }
    if (newSource.feed_url.trim() && !isValidHttpUrl(newSource.feed_url)) {
      nextErrors.feed_url = "Enter a valid feed URL.";
    }
    return nextErrors;
  }

  async function createSource() {
    const nextErrors = validateNewSource();
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const nextError = "Please fix the new source fields.";
      setGlobalError(nextError);
      setGlobalMessage("");
      toast.error(nextError);
      return;
    }

    setCreating(true);
    setGlobalError("");
    setGlobalMessage("");

    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/sources/create/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          feed_url: newSource.feed_url.trim(),
          enabled: true,
          requires_manual_url: true,
          auto_publish_website: false,
          auto_publish_facebook: false,
          approval_required_for_website: true,
          approval_required_for_facebook: true,
          cadence_value: 30,
          cadence_unit: "minutes",
          max_jobs_per_run: 25,
          status: "warning",
          mode: "manual",
          default_category: "white-collar",
        }),
      });

      if (!response.ok) {
        throw new Error(
          normalizeServerError(await response.text(), "Unable to create source."),
        );
      }

      const created = (await response.json()) as FetchSource;
      setSourceState((current) => ({ ...current, [created.id]: created }));
      setOpenSourceId(created.id);
      setNewSource({
        feed_url: "",
      });
      setCreateErrors({});
      const nextMessage = "Source created. Open Configure to adjust mode or defaults.";
      setGlobalMessage(nextMessage);
      toast.success(nextMessage);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to create source.";
      setGlobalError(nextError);
      toast.error(nextError);
    } finally {
      setCreating(false);
    }
  }

  async function saveSource(sourceId: number) {
    const source = sourceState[sourceId];
    if (!source) return;
    const nextErrors = validateSource(source);
    setFieldErrors((current) => ({ ...current, [sourceId]: nextErrors }));
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted source fields.");
      setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
      setStatusError((current) => ({ ...current, [sourceId]: "Please fix the highlighted source fields." }));
      return;
    }

    setSavingId(sourceId);
    setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
    setStatusError((current) => ({ ...current, [sourceId]: "" }));

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/sources/${sourceId}/`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          label: source.label,
          domain: source.domain,
          feed_url: source.feed_url ?? "",
          mode: source.mode,
          enabled: source.enabled,
          requires_manual_url: source.requires_manual_url,
          auto_publish_website: source.auto_publish_website ?? false,
          auto_publish_facebook: source.auto_publish_facebook ?? false,
          approval_required_for_website: source.approval_required_for_website ?? false,
          approval_required_for_facebook: source.approval_required_for_facebook ?? false,
          default_category: source.default_category,
          cadence_value: source.cadence_value,
          cadence_unit: source.cadence_unit,
          max_jobs_per_run: source.max_jobs_per_run ?? 25,
          status: source.status,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to save source."));
      }

      const updated = (await response.json()) as FetchSource;
      setSourceState((current) => ({ ...current, [sourceId]: updated }));
      setFieldErrors((current) => ({ ...current, [sourceId]: {} }));
      setStatusMessage((current) => ({ ...current, [sourceId]: "Source updated." }));
      toast.success("Source updated.");
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to save source.";
      setStatusError((current) => ({
        ...current,
        [sourceId]: nextError,
      }));
      toast.error(nextError);
    } finally {
      setSavingId(null);
    }
  }

  async function runSource(sourceId: number) {
    const source = sourceState[sourceId];
    if (!source) return;
    if (source.requires_manual_url || source.mode === "manual") {
      toast.error("This source is manual-only.");
      setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
      setStatusError((current) => ({
        ...current,
        [sourceId]:
          "This source is manual-only. Use Create job > Fetch with a job URL, or switch the source to HTML/RSS first.",
      }));
      return;
    }
    if (!source.feed_url?.trim()) {
      toast.error("This source has no source URL configured yet.");
      setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
      setStatusError((current) => ({
        ...current,
        [sourceId]: "This source has no source URL configured yet.",
      }));
      return;
    }

    setGlobalError("");
    setGlobalMessage("");
    setRunningId(sourceId);
    setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
    setStatusError((current) => ({ ...current, [sourceId]: "" }));

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/sources/${sourceId}/run/`, {
        method: "POST",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to run source."));
      }

      const result = (await response.json()) as {
        fetched_count?: number;
        created_count?: number;
        updated_count?: number;
      };
      const nextMessage = `Run complete. ${result.fetched_count ?? 0} fetched, ${result.created_count ?? 0} created, ${result.updated_count ?? 0} updated.`;
      setStatusMessage((current) => ({
        ...current,
        [sourceId]: nextMessage,
      }));
      toast.success(nextMessage);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to run source.";
      setStatusError((current) => ({
        ...current,
        [sourceId]: nextError,
      }));
      toast.error(nextError);
    } finally {
      setRunningId(null);
    }
  }

  async function createDraftFromManualSource(sourceId: number) {
    const source = sourceState[sourceId];
    const intakeUrl = manualIntakeUrls[sourceId]?.trim() ?? "";

    if (!source) return;
    if (!intakeUrl) {
      toast.error("Paste a job URL first.");
      setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
      setStatusError((current) => ({
        ...current,
        [sourceId]: "Paste a job URL first.",
      }));
      return;
    }
    if (!isValidHttpUrl(intakeUrl)) {
      toast.error("Enter a valid job URL.");
      setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
      setStatusError((current) => ({
        ...current,
        [sourceId]: "Enter a valid job URL.",
      }));
      return;
    }

    setIntakingId(sourceId);
    setStatusMessage((current) => ({ ...current, [sourceId]: "" }));
    setStatusError((current) => ({ ...current, [sourceId]: "" }));

    try {
      const scrapeResponse = await fetch("/api/admin/proxy/jobs/admin/jobs/scrape/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url: intakeUrl }),
      });

      if (!scrapeResponse.ok) {
        throw new Error(
          normalizeServerError(await scrapeResponse.text(), "Unable to fetch job details from that URL."),
        );
      }

      const scraped = (await scrapeResponse.json()) as {
        title?: string;
        company?: string;
        location?: string;
        employment_type?: string;
        category?: FetchSource["default_category"];
        source_url?: string;
        description_en?: string;
        description_mm?: string;
        salary?: string;
        contact_email?: string;
        contact_phone?: string;
      };

      const createResponse = await fetch("/api/admin/proxy/jobs/admin/jobs/create/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: scraped.title?.trim() || "Imported job listing",
          company: scraped.company?.trim() || source.label,
          location: scraped.location?.trim() || "Thailand",
          category: scraped.category || source.default_category,
          description_mm:
            scraped.description_mm?.trim() ||
            scraped.description_en?.trim() ||
            `Imported from ${source.label}.`,
          description_en: scraped.description_en?.trim() || "",
          source: "manual",
          source_url: scraped.source_url?.trim() || intakeUrl,
          employment_type: scraped.employment_type?.trim() || "full-time",
          salary: scraped.salary?.trim() || "",
          contact_email: scraped.contact_email?.trim() || "",
          contact_phone: scraped.contact_phone?.trim() || "",
          status: "draft",
          is_active: false,
          requires_website_approval: true,
          requires_facebook_approval: true,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(
          normalizeServerError(await createResponse.text(), "Unable to create a draft job from that URL."),
        );
      }

      const created = (await createResponse.json()) as { id: number; title?: string };
      const nextMessage = `Draft created for ${created.title || "the imported job"}. Opening editor...`;
      setStatusMessage((current) => ({
        ...current,
        [sourceId]: nextMessage,
      }));
      toast.success(nextMessage);
      router.push(`/admin/jobs/${created.id}`);
    } catch (error) {
      const nextError =
        error instanceof Error ? error.message : "Unable to create a draft job from that URL.";
      setStatusError((current) => ({
        ...current,
        [sourceId]: nextError,
      }));
      toast.error(nextError);
    } finally {
      setIntakingId(null);
    }
  }

  async function deleteSource() {
    if (!targetDeleteId) return;

    setDeletingId(targetDeleteId);
    setGlobalError("");
    setGlobalMessage("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/sources/${targetDeleteId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          normalizeServerError(await response.text(), "Unable to delete source."),
        );
      }

      setSourceState((current) => {
        const next = { ...current };
        delete next[targetDeleteId];
        return next;
      });
      setOpenSourceId((current) => (current === targetDeleteId ? null : current));
      setGlobalMessage("Source deleted.");
      toast.success("Source deleted.");
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Unable to delete source.";
      setGlobalError(nextError);
      toast.error(nextError);
    } finally {
      setDeletingId(null);
      setTargetDeleteId(null);
      setConfirmDeleteOpen(false);
    }
  }

  return (
    <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
      <CardContent className="grid gap-4 p-5">
        <section className="grid gap-4 rounded-[20px] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.74)] p-4">
          <div className="flex items-center gap-2 text-[#334039]">
            <Plus className="h-4 w-4" />
            <strong className="font-medium">New source</strong>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Source URL</span>
              <Input
                value={newSource.feed_url}
                onChange={(event) => setNewSource({ feed_url: event.target.value })}
                placeholder="https://example.com/jobs or RSS feed"
              />
              {createErrors.feed_url ? <span className="text-sm text-[#8e4a4a]">{createErrors.feed_url}</span> : null}
            </label>
            <button className={buttonVariants()} type="button" disabled={creating} onClick={() => void createSource()}>
              {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? "Creating..." : "Add source"}
            </button>
          </div>
        </section>

        {globalError ? (
          <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        ) : null}
        {globalMessage ? (
          <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{globalMessage}</span>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {orderedSources.map((source) => {
            const current = sourceState[source.id] ?? source;
            const isOpen = openSourceId === source.id;
            const isSaving = savingId === source.id;
            const isRunning = runningId === source.id;
            const isIntaking = intakingId === source.id;
            const currentFieldErrors = fieldErrors[source.id] ?? {};
            const intakeUrl = manualIntakeUrls[source.id] ?? "";

            return (
              <article
                key={source.id}
                className={cn(
                  "grid gap-4 rounded-[20px] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.74)] p-4 transition-colors",
                  isOpen && "border-[rgba(116,141,122,0.28)] bg-[rgba(246,250,247,0.96)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{current.label}</strong>
                    <span className="block text-[0.92rem] text-[#727975]">{current.domain}</span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-w-[84px] items-center justify-center rounded-full px-3 py-1 text-[0.72rem] uppercase tracking-[0.1em]",
                      current.status === "healthy" && "bg-[rgba(76,145,118,0.14)] text-[#246245]",
                      current.status === "warning" && "bg-[rgba(204,165,92,0.16)] text-[#8a6120]",
                      current.status === "paused" && "bg-[rgba(114,121,117,0.16)] text-[#59605d]",
                    )}
                  >
                    {current.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-[0.92rem] text-[#727975]">
                  <span>{formatSourceMode(current)}</span>
                  <span>
                    {current.requires_manual_url
                      ? "Manual URL required"
                      : `Every ${current.cadence_value} ${current.cadence_unit}`}
                  </span>
                </div>

                {statusError[source.id] ? (
                  <div className="rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
                    {statusError[source.id]}
                  </div>
                ) : null}
                {statusMessage[source.id] ? (
                  <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{statusMessage[source.id]}</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      isOpen && "border-[rgba(116,141,122,0.24)] bg-[rgba(144,168,147,0.12)] text-[#30423a]",
                    )}
                    type="button"
                    onClick={() => {
                      setGlobalError("");
                      setGlobalMessage("");
                      setOpenSourceId(isOpen ? null : source.id);
                    }}
                  >
                    <Settings2 className="h-4 w-4" />
                    {isOpen ? "Close setup" : "Configure"}
                  </button>
                  <button
                    className={buttonVariants({ variant: "secondary" })}
                    type="button"
                    disabled={isRunning || isIntaking}
                    onClick={() => void runSource(source.id)}
                  >
                    {isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {isRunning ? "Running..." : "Run now"}
                  </button>
                  <button
                    className={buttonVariants({ variant: "secondary" })}
                    type="button"
                    onClick={() => {
                      setTargetDeleteId(source.id);
                      setConfirmDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                {isOpen ? (
                  <div className="grid gap-4 border-t border-[rgba(160,183,164,0.16)] pt-4">
                    <div className="rounded-xl border border-[rgba(116,141,122,0.14)] bg-[rgba(144,168,147,0.08)] px-3 py-2 text-sm text-[#4f6354]">
                      Editing source configuration for <strong>{current.label}</strong>.
                    </div>
                    {current.requires_manual_url || current.mode === "manual" ? (
                      <div className="grid gap-3 rounded-xl border border-[rgba(160,183,164,0.16)] bg-white px-3 py-3">
                        <div className="text-sm font-medium text-[#334039]">Manual intake URL</div>
                        <label className="grid gap-2">
                          <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Job URL</span>
                          <div className="relative">
                            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8da693]" />
                            <Input
                              className="bg-[rgba(255,255,255,0.88)] pl-10"
                              value={intakeUrl}
                              onChange={(event) => updateManualIntakeUrl(source.id, event.target.value)}
                              placeholder="https://example.com/job-post"
                            />
                          </div>
                        </label>
                        <div className="flex justify-end">
                          <button
                            className={buttonVariants()}
                            type="button"
                            disabled={isIntaking}
                            onClick={() => void createDraftFromManualSource(source.id)}
                          >
                            {isIntaking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            {isIntaking ? "Creating draft..." : "Create draft from URL"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Label</span>
                        <Input
                          className="bg-[rgba(255,255,255,0.88)]"
                          value={current.label}
                          onChange={(event) => updateSource(source.id, { label: event.target.value })}
                        />
                        {currentFieldErrors.label ? <span className="text-sm text-[#8e4a4a]">{currentFieldErrors.label}</span> : null}
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Domain</span>
                        <Input
                          className="bg-[rgba(255,255,255,0.88)]"
                          value={current.domain}
                          onChange={(event) => updateSource(source.id, { domain: event.target.value })}
                        />
                        {currentFieldErrors.domain ? <span className="text-sm text-[#8e4a4a]">{currentFieldErrors.domain}</span> : null}
                      </label>
                      <label className="grid gap-2 md:col-span-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Feed URL</span>
                        <Input
                          className="bg-[rgba(255,255,255,0.88)]"
                          value={current.feed_url ?? ""}
                          onChange={(event) => updateSource(source.id, { feed_url: event.target.value })}
                        />
                        {currentFieldErrors.feed_url ? <span className="text-sm text-[#8e4a4a]">{currentFieldErrors.feed_url}</span> : null}
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Mode</span>
                        <select
                          className="h-11 rounded-xl border border-border/70 bg-white px-4 text-sm text-foreground shadow-none outline-none focus:border-[#8da693]"
                          value={current.mode}
                          onChange={(event) =>
                            updateSource(source.id, { mode: event.target.value as FetchSource["mode"] })
                          }
                        >
                          <option value="html">HTML</option>
                          <option value="rss">RSS</option>
                          <option value="manual">Manual</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Category</span>
                        <select
                          className="h-11 rounded-xl border border-border/70 bg-white px-4 text-sm text-foreground shadow-none outline-none focus:border-[#8da693]"
                          value={current.default_category}
                          onChange={(event) =>
                            updateSource(source.id, {
                              default_category: event.target.value as FetchSource["default_category"],
                            })
                          }
                        >
                          <option value="ngo">NGO</option>
                          <option value="white-collar">White collar</option>
                          <option value="blue-collar">Blue collar</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Cadence</span>
                        <Input
                          className="bg-[rgba(255,255,255,0.88)]"
                          type="number"
                          min={0}
                          value={current.cadence_value}
                          onChange={(event) =>
                            updateSource(source.id, { cadence_value: Number(event.target.value) })
                          }
                        />
                        {currentFieldErrors.cadence_value ? <span className="text-sm text-[#8e4a4a]">{currentFieldErrors.cadence_value}</span> : null}
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Unit</span>
                        <select
                          className="h-11 rounded-xl border border-border/70 bg-white px-4 text-sm text-foreground shadow-none outline-none focus:border-[#8da693]"
                          value={current.cadence_unit}
                          onChange={(event) =>
                            updateSource(source.id, {
                              cadence_unit: event.target.value as FetchSource["cadence_unit"],
                            })
                          }
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Max jobs per run</span>
                        <Input
                          className="bg-[rgba(255,255,255,0.88)]"
                          type="number"
                          min={1}
                          value={current.max_jobs_per_run ?? 25}
                          onChange={(event) =>
                            updateSource(source.id, { max_jobs_per_run: Number(event.target.value) })
                          }
                        />
                        {currentFieldErrors.max_jobs_per_run ? <span className="text-sm text-[#8e4a4a]">{currentFieldErrors.max_jobs_per_run}</span> : null}
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-3 py-3 text-sm text-[#465049]">
                        <span>Enabled</span>
                        <input
                          type="checkbox"
                          className="h-[18px] w-[18px] accent-[#8da693]"
                          checked={current.enabled}
                          onChange={(event) => updateSource(source.id, { enabled: event.target.checked })}
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-border/70 bg-white px-3 py-3 text-sm text-[#465049]">
                        <span>Manual URL required</span>
                        <input
                          type="checkbox"
                          className="h-[18px] w-[18px] accent-[#8da693]"
                          checked={current.requires_manual_url}
                          onChange={(event) =>
                            updateSource(source.id, { requires_manual_url: event.target.checked })
                          }
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        className={buttonVariants({ variant: "secondary" })}
                        type="button"
                        onClick={() => setOpenSourceId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className={buttonVariants()}
                        type="button"
                        disabled={isSaving}
                        onClick={() => void saveSource(source.id)}
                      >
                        {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Delete source"
          description="This will remove the selected source and its configuration."
          confirmLabel="Delete"
          isLoading={deletingId !== null}
          onConfirm={() => void deleteSource()}
          onCancel={() => {
            if (deletingId !== null) return;
            setConfirmDeleteOpen(false);
            setTargetDeleteId(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
