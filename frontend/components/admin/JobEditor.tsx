"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Link2, LoaderCircle, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Job, JobCategory, JobStatus } from "@/lib/types";

const categoryOptions: Array<{ value: JobCategory; label: string }> = [
  { value: "ngo", label: "NGO" },
  { value: "white-collar", label: "White collar" },
  { value: "blue-collar", label: "Blue collar" },
];

const statusOptions: Array<{ value: JobStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
  { value: "pending-review", label: "Pending review" },
];

export function JobEditor({ initialJob }: { initialJob?: Partial<Job> }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [company, setCompany] = useState(initialJob?.company ?? "");
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [employmentType, setEmploymentType] = useState(initialJob?.employment_type ?? "full-time");
  const [salary, setSalary] = useState(initialJob?.salary ?? "");
  const [status, setStatus] = useState<JobStatus>(initialJob?.status ?? "draft");
  const [category, setCategory] = useState<JobCategory>(initialJob?.category ?? "white-collar");
  const [source, setSource] = useState(initialJob?.source ?? "manual");
  const [sourceUrl, setSourceUrl] = useState(initialJob?.source_url ?? "");
  const [intakeUrl, setIntakeUrl] = useState(initialJob?.source_url ?? "");
  const [descriptionMm, setDescriptionMm] = useState(initialJob?.description_mm ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialJob?.description_en ?? "");
  const [isActive, setIsActive] = useState(initialJob?.is_active ?? true);
  const [requiresWebsiteApproval, setRequiresWebsiteApproval] = useState(
    initialJob?.requires_website_approval ?? false,
  );
  const [requiresFacebookApproval, setRequiresFacebookApproval] = useState(
    initialJob?.requires_facebook_approval ?? false,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingFromUrl, setIsFetchingFromUrl] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#8da693]";
  const inputClassName =
    "h-11 rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";
  const selectClass =
    "h-11 w-full rounded-md border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] px-3 text-sm text-foreground outline-none transition focus:border-[rgba(116,141,122,0.3)]";
  const panelClass =
    "grid gap-4 rounded-md border border-[rgba(160,183,164,0.14)] bg-[rgba(255,255,255,0.62)] px-4 py-4";

  async function fetchFromUrl() {
    const url = intakeUrl.trim();
    if (!url) {
      setFetchError("Paste a job URL first.");
      setFetchMessage("");
      return;
    }

    setIsFetchingFromUrl(true);
    setFetchError("");
    setFetchMessage("");

    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/jobs/scrape/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Could not fetch job details from that URL.");
      }

      const scraped = (await response.json()) as Partial<Job>;
      setSourceUrl(scraped.source_url?.trim() || url);
      setIntakeUrl(scraped.source_url?.trim() || url);
      setTitle(scraped.title?.trim() || "");
      setCompany(scraped.company?.trim() || "");
      setLocation(scraped.location?.trim() || "");
      setEmploymentType(scraped.employment_type?.trim() || "full-time");
      setCategory((scraped.category as JobCategory | undefined) ?? "white-collar");
      setSource(scraped.source?.trim() || "manual");
      setSalary(scraped.salary?.trim() || "");
      setDescriptionEn(scraped.description_en?.trim() || "");
      setDescriptionMm(scraped.description_mm?.trim() || scraped.description_en?.trim() || "");
      setFetchMessage("Fetched page details and filled the form below.");
    } catch (fetchError) {
      setFetchError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not fetch job details from that URL.",
      );
    } finally {
      setIsFetchingFromUrl(false);
    }
  }

  async function saveJob() {
    setIsSaving(true);
    setError("");
    setMessage("");

    const payload = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      employment_type: employmentType.trim(),
      salary: salary.trim(),
      status,
      category,
      source: source.trim() || "manual",
      source_url: sourceUrl.trim(),
      description_mm: descriptionMm.trim(),
      description_en: descriptionEn.trim(),
      is_active: isActive,
      requires_website_approval: requiresWebsiteApproval,
      requires_facebook_approval: requiresFacebookApproval,
    };

    try {
      const isEdit = Boolean(initialJob?.id);
      const response = await fetch(
        isEdit
          ? `/api/admin/proxy/jobs/admin/jobs/${initialJob?.id}/`
          : "/api/admin/proxy/jobs/admin/jobs/create/",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Unable to save job.");
      }

      const result = (await response.json()) as Job;
      setMessage(isEdit ? "Job updated." : "Job created.");
      router.push(`/admin/jobs/${result.id}`);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save job.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteJob() {
    if (!initialJob?.id) return;
    if (!window.confirm("Delete this job?")) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${initialJob.id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Unable to delete job.");
      }

      router.push("/admin/jobs");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete job.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void saveJob();
      }}
    >
      <section className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={eyebrowClass}>Manual intake</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
              Paste a job URL and fetch the basics
            </h2>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.74)] text-[#748d7a]">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Job URL</span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8da693]" />
              <Input
                className={cn(inputClassName, "pl-10")}
                value={intakeUrl}
                onChange={(event) => setIntakeUrl(event.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
              />
            </div>
          </label>
          <div className="flex items-end">
            <button
              className={cn(buttonVariants(), "min-w-[140px] rounded-md")}
              type="button"
              disabled={isFetchingFromUrl}
              onClick={() => void fetchFromUrl()}
            >
              {isFetchingFromUrl ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isFetchingFromUrl ? "Fetching..." : "Fetch"}
            </button>
          </div>
        </div>
        <p className="text-sm leading-6 text-[#727975]">
          Use this for manual scraping. Fetch fills the form below with title, company,
          location, source URL, and page description.
        </p>
        {isFetchingFromUrl ? (
          <div className="flex items-center gap-2 rounded-md border border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>Fetching job details from the pasted URL...</span>
          </div>
        ) : null}
        {!isFetchingFromUrl && fetchError ? (
          <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        ) : null}
        {!isFetchingFromUrl && fetchMessage && !fetchError ? (
          <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{fetchMessage}</span>
          </div>
        ) : null}
      </section>

      <section className={panelClass}>
        <div>
          <div className={eyebrowClass}>Job CRUD</div>
          <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
            Listing details
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Job title</span>
            <Input
              className={inputClassName}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Senior Operations Manager"
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Company</span>
            <Input
              className={inputClassName}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Dear Career"
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Location</span>
            <Input
              className={inputClassName}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bangkok"
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Employment type</span>
            <Input
              className={inputClassName}
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
              placeholder="full-time"
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Category</span>
            <select className={selectClass} value={category} onChange={(event) => setCategory(event.target.value as JobCategory)}>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Status</span>
            <select className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as JobStatus)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Salary</span>
            <Input
              className={inputClassName}
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              placeholder="THB 60,000 - 80,000"
            />
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Source</span>
            <Input
              className={inputClassName}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="manual"
            />
          </label>
          <label className={`${fieldLabelClass} md:col-span-2`}>
            <span className={eyebrowClass}>Source URL</span>
            <Input
              className={inputClassName}
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/..."
            />
          </label>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.85fr)]">
        <div className={panelClass}>
          <div>
            <div className={eyebrowClass}>Descriptions</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
              Job content
            </h2>
          </div>
          <div className="grid gap-4">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Myanmar description</span>
              <Textarea
                className="min-h-[220px] rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={descriptionMm}
                onChange={(event) => setDescriptionMm(event.target.value)}
                placeholder="Myanmar copy..."
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>English description</span>
              <Textarea
                className="min-h-[220px] rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                placeholder="English copy..."
              />
            </label>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className={panelClass}>
            <div>
              <div className={eyebrowClass}>Publishing</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
                Workflow
              </h2>
            </div>
            <label className="flex items-start justify-between gap-4">
              <span className="grid gap-1">
                <strong className="font-medium text-[#334039]">Active listing</strong>
                <small className="text-[0.9rem] leading-6 text-[#727975]">
                  Show this job in internal and public listings.
                </small>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
            </label>
            <label className="flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.12)] pt-4">
              <span className="grid gap-1">
                <strong className="font-medium text-[#334039]">Website approval</strong>
                <small className="text-[0.9rem] leading-6 text-[#727975]">
                  Hold this listing for editorial review before it goes live.
                </small>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                checked={requiresWebsiteApproval}
                onChange={(event) => setRequiresWebsiteApproval(event.target.checked)}
              />
            </label>
            <label className="flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.12)] pt-4">
              <span className="grid gap-1">
                <strong className="font-medium text-[#334039]">Facebook approval</strong>
                <small className="text-[0.9rem] leading-6 text-[#727975]">
                  Queue a separate approval step for Facebook publishing.
                </small>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                checked={requiresFacebookApproval}
                onChange={(event) => setRequiresFacebookApproval(event.target.checked)}
              />
            </label>
          </div>

          {(error || message) && (
            <div
              className={cn(
                "rounded-md border px-4 py-3 text-sm",
                error
                  ? "border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] text-[#8e4a4a]"
                  : "border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] text-[#4f6354]",
              )}
            >
              {error || message}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button className={cn(buttonVariants(), "rounded-md")} type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : initialJob?.id ? "Update job" : "Create job"}
            </button>
            {initialJob?.id ? (
              <button
                className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
                type="button"
                disabled={isDeleting}
                onClick={() => void deleteJob()}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>
        </aside>
      </section>
    </form>
  );
}
