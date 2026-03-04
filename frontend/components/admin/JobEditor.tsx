"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Link2, LoaderCircle, Sparkles, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  jobIntakeUrlSchema,
  validateJobImageFile,
  validateJobEditorFields,
  type JobEditorFieldErrors,
} from "@/lib/admin-form-validation";
import { requestAdmin, requestAdminNoContent } from "@/lib/admin-client";
import { buildFacebookPostMessage, parseJobDescription } from "@/lib/job-content";
import { cn } from "@/lib/utils";
import type { Job, JobCategory, JobStatus } from "@/lib/types";
import { useJobImageManager } from "@/components/admin/useJobImageManager";

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

const employmentTypeOptions = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const FETCH_TIMEOUT_MS = 20000;
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
function normalizeErrorDetail(detail: string) {
  const trimmed = detail.trim();

  try {
    const parsed = JSON.parse(detail) as { detail?: string; error?: string; message?: string };
    return (parsed.detail || parsed.error || parsed.message || trimmed).trim();
  } catch {
    const normalized = trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (normalized.includes("APPEND_SLASH") || normalized.includes("trailing slash")) {
      return "The source fetch endpoint was requested with the wrong URL format. Try again.";
    }
    return normalized;
  }
}

export function JobEditor({
  initialJob,
  returnTo = "",
}: {
  initialJob?: Partial<Job>;
  returnTo?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [company, setCompany] = useState(initialJob?.company ?? "");
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [employmentType, setEmploymentType] = useState(initialJob?.employment_type ?? "full-time");
  const [salary, setSalary] = useState(initialJob?.salary ?? "");
  const [contactEmail, setContactEmail] = useState(initialJob?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initialJob?.contact_phone ?? "");
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeIntakeMode, setActiveIntakeMode] = useState<"url" | "image" | null>(null);
  const [intakeFields, setIntakeFields] = useState<string[]>([]);
  const [intakeMessage, setIntakeMessage] = useState("");
  const [intakeError, setIntakeError] = useState("");
  const [urlIntakeError, setUrlIntakeError] = useState("");
  const [ocrImageFile, setOcrImageFile] = useState<File | null>(null);
  const [ocrImageError, setOcrImageError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<JobEditorFieldErrors>({});
  const safeReturnTo = returnTo.startsWith("/admin") && !returnTo.startsWith("//") ? returnTo : "";
  const {
    imageUrl,
    setImageUrl,
    selectedImageFile,
    uploadedImageUrl,
    imagePreviewUrl,
    imageUploadError,
    setImageUploadError,
    isUploadingImage,
    isRemovingImage,
    applyJobImageState,
    clearSelectedImageFile,
    handleImageFileChange,
    uploadSelectedImage,
    removeUploadedImage,
  } = useJobImageManager({
    initialJob,
    validateJobImageFile,
    onError: (nextError) => toast.error(nextError),
    onSuccess: (nextMessage) => toast.success(nextMessage),
  });
  const liveJobErrors = validateJobEditorFields({
    title,
    company,
    location,
    descriptionMm,
    sourceUrl,
    imageUrl,
    contactEmail,
  });
  const imageFileError = validateJobImageFile(selectedImageFile);
  const ocrImageFileError = validateJobImageFile(ocrImageFile);
  const canFetchFromUrl = jobIntakeUrlSchema.safeParse(intakeUrl.trim()).success;
  const isProcessingIntake = activeIntakeMode !== null;
  const canExtractFromImage = Boolean(ocrImageFile) && !ocrImageFileError;
  const canSaveJob = Object.keys(liveJobErrors).length === 0 && !imageFileError;
  const previewJob = useMemo<Partial<Job>>(
    () => ({
      title: title.trim() || "Job title preview",
      company: company.trim() || "Company name",
      location: location.trim() || "Location",
      employment_type: employmentType,
      salary: salary.trim(),
      source_url: sourceUrl.trim(),
      image_url: imagePreviewUrl || imageUrl.trim(),
      description_mm: descriptionMm.trim(),
      description_en: descriptionEn.trim(),
    }),
    [company, descriptionEn, descriptionMm, employmentType, imagePreviewUrl, imageUrl, location, salary, sourceUrl, title],
  );
  const previewSections = useMemo(
    () => parseJobDescription(descriptionMm.trim() || descriptionEn.trim()),
    [descriptionEn, descriptionMm],
  );
  const facebookPreview = useMemo(
    () => buildFacebookPostMessage(previewJob as Job),
    [previewJob],
  );

  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#8da693]";
  const inputClassName =
    "h-11 rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";
  const inputErrorClass = "border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]";
  const selectClass =
    "h-11 w-full rounded-md border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] px-3 text-sm text-foreground outline-none transition focus:border-[rgba(116,141,122,0.3)]";
  const panelClass =
    "grid gap-4 rounded-md border border-[rgba(160,183,164,0.14)] bg-[rgba(255,255,255,0.62)] px-4 py-4";

  const intakeStatusTone = useMemo(() => {
    if (isProcessingIntake) {
      return "border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.1)] text-[#4f6354]";
    }

    if (intakeError) {
      return "border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] text-[#8e4a4a]";
    }

    if (intakeMessage) {
      return "border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] text-[#4f6354]";
    }

    return "border-[rgba(160,183,164,0.14)] bg-[rgba(255,255,255,0.74)] text-[#5c645f]";
  }, [intakeError, intakeMessage, isProcessingIntake]);

  function resetIntakeFeedback() {
    setIntakeError("");
    setIntakeMessage("");
    setIntakeFields([]);
  }

  function applyIntakePayload(scraped: Partial<Job>, options?: { fallbackSourceUrl?: string }) {
    const nextFetchedFields: string[] = [];
    const nextSourceUrl = scraped.source_url?.trim() || options?.fallbackSourceUrl || "";
    if (nextSourceUrl) {
      nextFetchedFields.push("source URL");
      setSourceUrl(nextSourceUrl);
      setIntakeUrl(nextSourceUrl);
    }

    const nextTitle = scraped.title?.trim();
    if (nextTitle) {
      nextFetchedFields.push("title");
      setTitle(nextTitle);
    }

    const nextCompany = scraped.company?.trim();
    if (nextCompany) {
      nextFetchedFields.push("company");
      setCompany(nextCompany);
    }

    const nextLocation = scraped.location?.trim();
    if (nextLocation) {
      nextFetchedFields.push("location");
      setLocation(nextLocation);
    }

    const nextEmploymentType = scraped.employment_type?.trim();
    if (nextEmploymentType) {
      nextFetchedFields.push("employment type");
      setEmploymentType(nextEmploymentType);
    }

    if (scraped.category) {
      nextFetchedFields.push("category");
      setCategory(scraped.category as JobCategory);
    }

    const nextSource = scraped.source?.trim();
    if (nextSource) {
      nextFetchedFields.push("source");
      setSource(nextSource);
    }

    const nextSalary = scraped.salary?.trim();
    if (nextSalary) {
      nextFetchedFields.push("salary");
      setSalary(nextSalary);
    }

    const nextContactEmail = scraped.contact_email?.trim();
    if (nextContactEmail) {
      nextFetchedFields.push("contact email");
      setContactEmail(nextContactEmail);
    }

    const nextContactPhone = scraped.contact_phone?.trim();
    if (nextContactPhone) {
      nextFetchedFields.push("contact phone");
      setContactPhone(nextContactPhone);
    }

    const nextDescriptionEn = scraped.description_en?.trim();
    if (nextDescriptionEn) {
      nextFetchedFields.push("English description");
      setDescriptionEn(nextDescriptionEn);
    }

    const nextDescriptionMm = scraped.description_mm?.trim() || nextDescriptionEn;
    if (nextDescriptionMm) {
      nextFetchedFields.push("Myanmar description");
      setDescriptionMm(nextDescriptionMm);
    }

    const nextImageUrl = scraped.image_url?.trim();
    if (nextImageUrl) {
      nextFetchedFields.push("image");
      setImageUrl(nextImageUrl, { syncPreview: !selectedImageFile && !uploadedImageUrl });
    }

    setIntakeFields(nextFetchedFields);
    return nextFetchedFields;
  }

  async function fetchFromUrl() {
    const url = intakeUrl.trim();
    const intakeResult = jobIntakeUrlSchema.safeParse(url);
    if (!intakeResult.success) {
      const nextFieldError = intakeResult.error.issues[0]?.message || "Enter a valid job URL.";
      setUrlIntakeError(nextFieldError);
      const nextError = `Fetch failed. ${nextFieldError}`;
      setIntakeError(nextError);
      setIntakeMessage("");
      setIntakeFields([]);
      toast.error(nextError);
      return;
    }

    setActiveIntakeMode("url");
    setUrlIntakeError("");
    resetIntakeFeedback();

    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch("/api/admin/proxy/jobs/admin/jobs/scrape", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = await response.text();
        const normalizedDetail = normalizeErrorDetail(detail);

        throw new Error(normalizedDetail || "Could not fetch job details from that URL.");
      }

      const scraped = (await response.json()) as Partial<Job>;
      const nextFetchedFields = applyIntakePayload(scraped, { fallbackSourceUrl: url });
      const nextMessage =
        nextFetchedFields.length > 0
          ? "Fetch complete. Review the autofilled fields below before saving."
          : "Fetch completed, but the source did not expose usable job fields. Fill the form manually or try a different URL.";
      setIntakeMessage(nextMessage);
      toast.success(nextMessage);
    } catch (fetchError) {
      setIntakeFields([]);
      const nextError =
        fetchError instanceof DOMException && fetchError.name === "AbortError"
          ? "Fetch failed. The source took too long to respond. Try again or use a different URL."
          : fetchError instanceof Error
            ? `Fetch failed. ${fetchError.message}`
            : "Fetch failed. Could not fetch job details from that URL.";
      setIntakeError(nextError);
      toast.error(nextError);
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setActiveIntakeMode(null);
    }
  }

  async function extractFromImage() {
    if (!ocrImageFile) {
      const nextError = "Upload an image before running image-to-text.";
      setOcrImageError(nextError);
      setIntakeError(nextError);
      setIntakeMessage("");
      setIntakeFields([]);
      toast.error(nextError);
      return;
    }

    const nextFileError = validateJobImageFile(ocrImageFile);
    if (nextFileError) {
      setOcrImageError(nextFileError);
      setIntakeError(nextFileError);
      setIntakeMessage("");
      setIntakeFields([]);
      toast.error(nextFileError);
      return;
    }

    setActiveIntakeMode("image");
    setOcrImageError("");
    resetIntakeFeedback();

    try {
      const formData = new FormData();
      formData.append("image", ocrImageFile);

      const extracted = await requestAdmin<Partial<Job>>("/api/admin/proxy/jobs/admin/jobs/ocr", {
        method: "POST",
        body: formData,
        fallbackError: "Unable to read text from the uploaded image.",
      });

      const nextFetchedFields = applyIntakePayload(extracted);
      const nextMessage =
        nextFetchedFields.length > 0
          ? "Image text extracted. Review the autofilled fields below before saving."
          : "Image text was read, but no usable job fields were mapped. Fill the form manually.";
      setIntakeMessage(nextMessage);
      toast.success(nextMessage);
    } catch (extractError) {
      setIntakeFields([]);
      const nextError =
        extractError instanceof Error
          ? `Image OCR failed. ${extractError.message}`
          : "Image OCR failed. Unable to read text from the uploaded image.";
      setIntakeError(nextError);
      toast.error(nextError);
    } finally {
      setActiveIntakeMode(null);
    }
  }

  async function saveJob() {
    const nextErrors = validateJobEditorFields({
      title,
      company,
      location,
      descriptionMm,
      sourceUrl,
      imageUrl,
      contactEmail,
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || imageFileError) {
      if (imageFileError) {
        setImageUploadError(imageFileError);
      }
      const nextError = "Please fix the highlighted job fields.";
      setError(nextError);
      setMessage("");
      toast.error(nextError);
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    const payload = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      employment_type: employmentType.trim(),
      salary: salary.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      status,
      category,
      source: source.trim() || "manual",
      source_url: sourceUrl.trim(),
      image_url: imageUrl.trim(),
      description_mm: descriptionMm.trim(),
      description_en: descriptionEn.trim(),
      is_active: isActive,
      requires_website_approval: requiresWebsiteApproval,
      requires_facebook_approval: requiresFacebookApproval,
    };

    try {
      const isEdit = Boolean(initialJob?.id);
      let result = await requestAdmin<Job>(
        isEdit
          ? `/api/admin/proxy/jobs/admin/jobs/${initialJob?.id}`
          : "/api/admin/proxy/jobs/admin/jobs/create",
        {
          method: isEdit ? "PATCH" : "POST",
          json: payload,
          fallbackError: "Unable to save job.",
        },
      );
      if (selectedImageFile) {
        result = (await uploadSelectedImage(result.id)) ?? result;
      } else {
        applyJobImageState(result);
      }
      const nextMessage = isEdit ? "Job updated." : "Job created.";
      setMessage(nextMessage);
      toast.success(nextMessage);
      if (isEdit && safeReturnTo) {
        router.push(safeReturnTo);
        return;
      }
      router.push(`/admin/jobs/${result.id}`);
    } catch (saveError) {
      const nextError = saveError instanceof Error ? saveError.message : "Unable to save job.";
      setError(nextError);
      toast.error(nextError);
    } finally {
      setIsSaving(false);
    }
  }

  function clearFieldError(field: keyof JobEditorFieldErrors) {
    if (!fieldErrors[field]) return;
    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
  }

  async function deleteJob() {
    if (!initialJob?.id) return;

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      await requestAdminNoContent(`/api/admin/proxy/jobs/admin/jobs/${initialJob.id}`, {
        method: "DELETE",
        fallbackError: "Unable to delete job.",
      });

      toast.success("Job deleted.");
      router.push(safeReturnTo || "/admin/jobs");
    } catch (deleteError) {
      const nextError = deleteError instanceof Error ? deleteError.message : "Unable to delete job.";
      setError(nextError);
      toast.error(nextError);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
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
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.74)] text-[#748d7a]">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="grid gap-3">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Job URL</span>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8da693]" />
                <Input
                  className={cn(
                    inputClassName,
                    "pl-10",
                    urlIntakeError
                      ? "border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]"
                      : "",
                  )}
                  value={intakeUrl}
                  onChange={(event) => {
                    setIntakeUrl(event.target.value);
                    if (urlIntakeError) {
                      setUrlIntakeError("");
                    }
                  }}
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  aria-invalid={Boolean(urlIntakeError)}
                  aria-describedby={urlIntakeError ? "job-intake-url-error" : undefined}
                />
              </div>
              {urlIntakeError ? (
                <span id="job-intake-url-error" className="text-sm text-[#8e4a4a]">
                  {urlIntakeError}
                </span>
              ) : null}
            </label>
            <button
              className={cn(
                buttonVariants(),
                "w-full rounded-md",
                (isProcessingIntake || !canFetchFromUrl) && "cursor-not-allowed opacity-60",
              )}
              type="button"
              aria-busy={activeIntakeMode === "url"}
              disabled={isProcessingIntake || !canFetchFromUrl}
              onClick={() => void fetchFromUrl()}
            >
              {activeIntakeMode === "url" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {activeIntakeMode === "url" ? "Fetching..." : "Fetch from URL"}
            </button>
          </div>
          <div className="grid gap-3">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Job image OCR</span>
              <Input
                className="h-auto rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] px-3 py-3 file:mr-3"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setOcrImageFile(nextFile);
                  setOcrImageError(nextFile ? validateJobImageFile(nextFile) : "");
                }}
              />
              <span className="text-sm leading-6 text-[#5c645f]">
                Upload a screenshot, poster, or scan and extract text into the form.
              </span>
              {ocrImageFile ? (
                <div className="flex items-center justify-between gap-3 rounded-md bg-[rgba(247,243,236,0.62)] px-3 py-2 text-sm text-[#4f6354]">
                  <span className="truncate">{ocrImageFile.name}</span>
                  <button
                    className="inline-flex items-center gap-1 text-[#8e4a4a]"
                    type="button"
                    onClick={() => {
                      setOcrImageFile(null);
                      setOcrImageError("");
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              ) : null}
              {ocrImageError || ocrImageFileError ? (
                <span className="text-sm text-[#8e4a4a]">{ocrImageError || ocrImageFileError}</span>
              ) : null}
            </label>
            <button
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full rounded-md",
                (isProcessingIntake || !canExtractFromImage) && "cursor-not-allowed opacity-60",
              )}
              type="button"
              aria-busy={activeIntakeMode === "image"}
              disabled={isProcessingIntake || !canExtractFromImage}
              onClick={() => void extractFromImage()}
            >
              {activeIntakeMode === "image" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {activeIntakeMode === "image" ? "Reading image..." : "Image to text"}
            </button>
          </div>
        </div>
        {isProcessingIntake || intakeError || intakeMessage ? (
          <div
            aria-live="polite"
            className={cn("grid gap-3 rounded-md border px-3 py-3 text-sm", intakeStatusTone)}
          >
            <div className="flex items-start gap-2">
              {isProcessingIntake ? (
                <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              ) : intakeError ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="grid gap-1">
                <strong className="font-medium">
                  {isProcessingIntake
                    ? activeIntakeMode === "image"
                      ? "Reading job image..."
                      : "Fetching job details..."
                    : intakeError
                      ? "Intake did not complete"
                      : "Intake completed"}
                </strong>
                <span>
                  {isProcessingIntake
                    ? activeIntakeMode === "image"
                      ? "Running OCR on the uploaded image and mapping detected text into job fields."
                      : "Checking the pasted source and extracting usable job fields."
                    : intakeError || intakeMessage}
                </span>
              </div>
            </div>
            {isProcessingIntake ? (
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(116,141,122,0.12)]">
                <div className="admin-fetch-progress h-full w-1/3 rounded-full bg-[#7f9785]" />
              </div>
            ) : null}
            {!isProcessingIntake && intakeFields.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {intakeFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded-full border border-[rgba(116,141,122,0.18)] bg-[rgba(255,255,255,0.86)] px-2.5 py-1 text-xs tracking-[0.08em] text-[#58705e]"
                  >
                    {field}
                  </span>
                ))}
              </div>
            ) : null}
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
              className={cn(inputClassName, fieldErrors.title && inputErrorClass)}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                clearFieldError("title");
              }}
              placeholder="Senior Operations Manager"
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.title}</span> : null}
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Company</span>
            <Input
              className={cn(inputClassName, fieldErrors.company && inputErrorClass)}
              value={company}
              onChange={(event) => {
                setCompany(event.target.value);
                clearFieldError("company");
              }}
              placeholder="Dear Career"
              aria-invalid={Boolean(fieldErrors.company)}
            />
            {fieldErrors.company ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.company}</span> : null}
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Location</span>
            <Input
              className={cn(inputClassName, fieldErrors.location && inputErrorClass)}
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                clearFieldError("location");
              }}
              placeholder="Bangkok"
              aria-invalid={Boolean(fieldErrors.location)}
            />
            {fieldErrors.location ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.location}</span> : null}
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Employment type</span>
            <select
              className={selectClass}
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
            >
              {employmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Contact email</span>
            <Input
              className={cn(inputClassName, fieldErrors.contactEmail && inputErrorClass)}
              value={contactEmail}
              onChange={(event) => {
                setContactEmail(event.target.value);
                clearFieldError("contactEmail");
              }}
              placeholder="jobs@example.org"
              aria-invalid={Boolean(fieldErrors.contactEmail)}
            />
            {fieldErrors.contactEmail ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.contactEmail}</span> : null}
          </label>
          <label className={fieldLabelClass}>
            <span className={eyebrowClass}>Contact phone</span>
            <Input
              className={inputClassName}
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="+66 ..."
            />
          </label>
          <label className={`${fieldLabelClass} md:col-span-2`}>
            <span className={eyebrowClass}>Source URL</span>
            <Input
              className={cn(inputClassName, fieldErrors.sourceUrl && inputErrorClass)}
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(event.target.value);
                clearFieldError("sourceUrl");
              }}
              placeholder="https://www.linkedin.com/jobs/view/..."
              aria-invalid={Boolean(fieldErrors.sourceUrl)}
            />
            {fieldErrors.sourceUrl ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.sourceUrl}</span> : null}
          </label>
          <label className={`${fieldLabelClass} md:col-span-2`}>
            <span className={eyebrowClass}>Image URL</span>
            <Input
              className={cn(inputClassName, fieldErrors.imageUrl && inputErrorClass)}
              value={imageUrl}
              onChange={(event) => {
                const nextValue = event.target.value;
                setImageUrl(nextValue, { syncPreview: !selectedImageFile });
                clearFieldError("imageUrl");
              }}
              placeholder="https://example.com/job-cover.jpg"
              aria-invalid={Boolean(fieldErrors.imageUrl)}
            />
            {fieldErrors.imageUrl ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.imageUrl}</span> : null}
          </label>
          <div className={`${fieldLabelClass} md:col-span-2`}>
            <span className={eyebrowClass}>Image upload</span>
            <label className="grid gap-3 rounded-md border border-dashed border-[rgba(160,183,164,0.22)] bg-[rgba(255,255,255,0.82)] px-4 py-4">
              <div className="flex items-start gap-3 text-sm text-[#5c645f]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(160,183,164,0.16)] bg-[rgba(247,243,236,0.66)] text-[#748d7a]">
                  <Upload className="h-4 w-4" />
                </span>
                <div className="grid gap-1">
                  <strong className="font-medium text-[#334039]">Upload a verified image</strong>
                  <span>Allowed: JPG, PNG, WEBP, GIF. Max size 10 MB. The backend rechecks the file bytes before saving.</span>
                </div>
              </div>
              <Input
                className="h-auto rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] px-3 py-3 file:mr-3"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={(event) => handleImageFileChange(event.target.files?.[0] ?? null)}
              />
              {selectedImageFile ? (
                <div className="flex items-center justify-between gap-3 rounded-md bg-[rgba(247,243,236,0.62)] px-3 py-2 text-sm text-[#4f6354]">
                  <span className="truncate">{selectedImageFile.name}</span>
                  <button
                    className="inline-flex items-center gap-1 text-[#8e4a4a]"
                    type="button"
                    onClick={clearSelectedImageFile}
                  >
                    <XCircle className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              ) : null}
              {imageUploadError || imageFileError ? (
                <span className="text-sm text-[#8e4a4a]">{imageUploadError || imageFileError}</span>
              ) : null}
            </label>
          </div>
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
                className={cn(
                  "min-h-[220px] rounded-md border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.9)] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  fieldErrors.descriptionMm && inputErrorClass,
                )}
                value={descriptionMm}
                onChange={(event) => {
                  setDescriptionMm(event.target.value);
                  clearFieldError("descriptionMm");
                }}
                placeholder="Myanmar copy..."
                aria-invalid={Boolean(fieldErrors.descriptionMm)}
              />
              {fieldErrors.descriptionMm ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.descriptionMm}</span> : null}
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
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="grid gap-3 rounded-md border border-[rgba(160,183,164,0.12)] bg-[rgba(247,243,236,0.52)] p-4">
              <div>
                <div className={eyebrowClass}>Website preview</div>
                <h3 className="mt-1 text-[0.96rem] font-semibold text-foreground">
                  Structured job content
                </h3>
              </div>
              <div className="grid gap-4 text-sm leading-7 text-[#5e6662]">
                {previewSections.length > 0 ? (
                  previewSections.map((section, index) => (
                    <section key={`${section.heading || "section"}-${index}`} className="grid gap-2">
                      {section.heading ? (
                        <h4 className="m-0 text-[0.72rem] uppercase tracking-[0.14em] text-[#4f6354]">
                          {section.heading}
                        </h4>
                      ) : null}
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="mb-0">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets.length > 0 ? (
                        <ul className="m-0 grid gap-1.5 pl-5">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet.replace(/^- /, "")}</li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))
                ) : (
                  <p className="mb-0 text-[#727975]">
                    Add headings like `Responsibilities` and bullet points to preview the final public layout.
                  </p>
                )}
              </div>
            </section>

            <section className="grid gap-3 rounded-md border border-[rgba(160,183,164,0.12)] bg-[rgba(255,255,255,0.8)] p-4">
              <div>
                <div className={eyebrowClass}>Facebook preview</div>
                <h3 className="mt-1 text-[0.96rem] font-semibold text-foreground">
                  Default caption
                </h3>
              </div>
              <pre className="m-0 whitespace-pre-wrap break-words rounded-md bg-[rgba(255,255,255,0.86)] p-3 text-sm leading-7 text-[#334039]">
                {facebookPreview || "The default Facebook caption will appear here."}
              </pre>
            </section>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className={panelClass}>
            <div>
              <div className={eyebrowClass}>Image preview</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
                Listing image
              </h2>
            </div>
            <div className="grid gap-3">
              <div className="overflow-hidden rounded-md border border-[rgba(160,183,164,0.14)] bg-[rgba(247,243,236,0.48)]">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt={title.trim() || "Job image preview"}
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center px-6 text-center text-sm leading-6 text-[#727975]">
                    Add an external image URL or upload a local image to preview the listing artwork.
                  </div>
                )}
              </div>
              <div className="grid gap-2 text-sm text-[#5c645f]">
                <span>
                  Priority: uploaded image first, scraped/external image URL second.
                </span>
                {initialJob?.id && uploadedImageUrl ? (
                  <button
                    className="inline-flex items-center gap-2 text-left text-[#8e4a4a]"
                    type="button"
                    disabled={isRemovingImage}
                    onClick={() => void removeUploadedImage(initialJob?.id)}
                  >
                    <XCircle className="h-4 w-4" />
                    {isRemovingImage ? "Removing uploaded image..." : "Remove uploaded image"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

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

          {(error || message || imageUploadError || imageFileError || Object.values(fieldErrors).some(Boolean)) && (
            <div
              className={cn(
                "rounded-md border px-4 py-3 text-sm",
                error || Object.values(fieldErrors).some(Boolean) || imageUploadError || imageFileError
                  ? "border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] text-[#8e4a4a]"
                  : "border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] text-[#4f6354]",
              )}
            >
              {error ||
                imageUploadError ||
                imageFileError ||
                (Object.values(fieldErrors).some(Boolean)
                  ? "Please complete the required job fields before creating this listing."
                  : message)}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              className={cn(
                buttonVariants(),
                "rounded-md",
                (isSaving || isUploadingImage || !canSaveJob) && "cursor-not-allowed opacity-60",
              )}
              type="submit"
              disabled={isSaving || isUploadingImage || !canSaveJob}
            >
              {isSaving || isUploadingImage
                ? selectedImageFile && !isSaving
                  ? "Uploading image..."
                  : "Saving..."
                : initialJob?.id
                  ? "Update job"
                  : "Create job"}
            </button>
            {initialJob?.id ? (
              <button
                className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : null}
          </div>
        </aside>
      </section>
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete job"
        description="This will permanently remove this job from the admin panel."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={() => void deleteJob()}
        onCancel={() => {
          if (isDeleting) return;
          setConfirmDeleteOpen(false);
        }}
      />
    </form>
  );
}
