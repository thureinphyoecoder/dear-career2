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
  mapJobEditorServerErrors,
  validateJobImageFile,
  validateJobEditorFields,
  type JobEditorFieldErrors,
} from "@/lib/admin-form-validation";
import { requestAdmin, requestAdminNoContent } from "@/lib/admin-client";
import { buildFacebookPostMessage, extractJobFacts, parseJobDescription } from "@/lib/job-content";
import { cn } from "@/lib/utils";
import type { Job, JobCategory, JobStatus } from "@/lib/types";
import { useJobImageManager } from "@/components/admin/useJobImageManager";

const categoryOptions: Array<{ value: JobCategory; label: string }> = [
  { value: "ngo", label: "NGO" },
  { value: "white-collar", label: "White collar" },
  { value: "blue-collar", label: "Blue collar" },
];

const statusOptions: Array<{ value: JobStatus; label: string }> = [
  { value: "draft", label: "Not live yet" },
  { value: "published", label: "Live on website" },
  { value: "archived", label: "Hidden" },
  { value: "pending-review", label: "Needs review" },
];

const employmentTypeOptions = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const FETCH_TIMEOUT_MS = 20000;
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const OCR_UPLOAD_MAX_EDGE_PX = 1900;
const OCR_UPLOAD_TARGET_BYTES = 1_200_000;
const OCR_UPLOAD_START_QUALITY = 0.88;
const OCR_UPLOAD_MIN_QUALITY = 0.62;
const OCR_MODE_OPTIONS = [
  { value: "fast", label: "Quick read" },
  { value: "balanced", label: "Balanced" },
  { value: "accurate", label: "Best quality" },
] as const;
const STRUCTURED_DESCRIPTION_TEMPLATE = `Website: yourcompany.com
Instagram: @yourbrand

The Role: This is a 100% remote, full-time position. You will work closely with the core team to deliver strong visual communication and consistent brand storytelling.

Details:
📍 Location: Remote (Based in Thailand)
⏰ Working Hours: Monday - Friday, 10:00 AM - 6:00 PM
💰 Salary: 29,000+ THB/month (reviewable)
📅 Start Date: March 2026

What you'll be doing:
• Creating bespoke illustrations and infographics.
• Designing social media assets, digital workbooks, and decks.
• Collaborating with cross-functional teams.
• Maintaining high brand standards across platforms.

Who we are looking for:
• Strong portfolio in graphic design and illustration.
• Proficiency in Adobe Illustrator and Photoshop.
• Canva experience for fast-turnaround assets.
• Good English communication and remote collaboration skills.

Why join us?
• Direct mentorship and career growth opportunities.
• Stable, long-term contract with an international team.

How to Apply:
Send Portfolio (Required) and Resume to hiring@company.com with the subject:
"Graphic Designer Application - [Your Name]".`;

function normalizeErrorDetail(detail: string) {
  const trimmed = detail.trim();

  try {
    const parsed = JSON.parse(detail) as { detail?: string; error?: string; message?: string };
    return (parsed.detail || parsed.error || parsed.message || trimmed).trim();
  } catch {
    const normalized = trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (normalized.includes("APPEND_SLASH") || normalized.includes("trailing slash")) {
      return "The job link format was not accepted. Please try again.";
    }
    return normalized;
  }
}

function summarizeIntakeValue(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function loadImageElementFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not open this image."));
    };
    image.src = objectUrl;
  });
}

async function optimizeImageForOcr(file: File) {
  const image = await loadImageElementFromFile(file);
  const longestEdge = Math.max(image.width, image.height);
  const needsResize = longestEdge > OCR_UPLOAD_MAX_EDGE_PX;
  const needsCompress = file.size > OCR_UPLOAD_TARGET_BYTES;

  if (!needsResize && !needsCompress) {
    return file;
  }

  const scale = needsResize ? OCR_UPLOAD_MAX_EDGE_PX / longestEdge : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);
  const toBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });

  let quality = OCR_UPLOAD_START_QUALITY;
  let blob = await toBlob(quality);
  while (blob && blob.size > OCR_UPLOAD_TARGET_BYTES && quality > OCR_UPLOAD_MIN_QUALITY) {
    quality = Math.max(OCR_UPLOAD_MIN_QUALITY, quality - 0.08);
    blob = await toBlob(quality);
  }

  if (!blob) {
    return file;
  }

  if (blob.size >= file.size && !needsResize) {
    return file;
  }

  const originalStem = file.name.replace(/\.[^.]+$/, "") || "ocr-image";
  return new File([blob], `${originalStem}-ocr.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
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
  const [status, setStatus] = useState<JobStatus>(initialJob?.status ?? "published");
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
  const [intakePreview, setIntakePreview] = useState<Array<{ label: string; value: string }>>([]);
  const [intakeMessage, setIntakeMessage] = useState("");
  const [intakeError, setIntakeError] = useState("");
  const [urlIntakeError, setUrlIntakeError] = useState("");
  const [ocrImageFile, setOcrImageFile] = useState<File | null>(null);
  const [ocrMode, setOcrMode] = useState<(typeof OCR_MODE_OPTIONS)[number]["value"]>("accurate");
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
  const previewFacts = useMemo(
    () => extractJobFacts(previewJob as Job),
    [previewJob],
  );
  const facebookPreview = useMemo(
    () => buildFacebookPostMessage(previewJob as Job),
    [previewJob],
  );

  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#6f8676]";
  const inputClassName =
    "h-11 rounded-md border-[rgba(150,174,157,0.28)] bg-white shadow-none text-[#2f3d35] placeholder:text-[#829189] focus-visible:border-[rgba(116,141,122,0.45)] focus-visible:ring-0 focus-visible:ring-offset-0";
  const inputErrorClass = "border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]";
  const selectClass =
    "h-11 w-full rounded-md border border-[rgba(150,174,157,0.28)] bg-white px-3 text-sm text-[#2f3d35] outline-none transition focus:border-[rgba(116,141,122,0.45)]";
  const panelClass =
    "grid gap-4 rounded-md border border-[rgba(150,174,157,0.26)] bg-white px-4 py-4";

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
    setIntakePreview([]);
  }

  function applyIntakePayload(scraped: Partial<Job>, options?: { fallbackSourceUrl?: string }) {
    const nextFetchedFields: string[] = [];
    const nextPreview: Array<{ label: string; value: string }> = [];
    const nextSourceUrl = scraped.source_url?.trim() || options?.fallbackSourceUrl || "";
    if (nextSourceUrl) {
      nextFetchedFields.push("source URL");
      nextPreview.push({ label: "Original job link", value: summarizeIntakeValue(nextSourceUrl, 86) });
      setSourceUrl(nextSourceUrl);
      setIntakeUrl(nextSourceUrl);
    }

    const nextTitle = scraped.title?.trim();
    if (nextTitle) {
      nextFetchedFields.push("title");
      nextPreview.push({ label: "Title", value: summarizeIntakeValue(nextTitle) });
      setTitle(nextTitle);
    }

    const nextCompany = scraped.company?.trim();
    if (nextCompany) {
      nextFetchedFields.push("company");
      nextPreview.push({ label: "Company", value: summarizeIntakeValue(nextCompany) });
      setCompany(nextCompany);
    }

    const nextLocation = scraped.location?.trim();
    if (nextLocation) {
      nextFetchedFields.push("location");
      nextPreview.push({ label: "Location", value: summarizeIntakeValue(nextLocation) });
      setLocation(nextLocation);
    }

    const nextEmploymentType = scraped.employment_type?.trim();
    if (nextEmploymentType) {
      nextFetchedFields.push("employment type");
      nextPreview.push({ label: "Employment type", value: summarizeIntakeValue(nextEmploymentType) });
      setEmploymentType(nextEmploymentType);
    }

    if (scraped.category) {
      nextFetchedFields.push("category");
      nextPreview.push({ label: "Category", value: summarizeIntakeValue(String(scraped.category)) });
      setCategory(scraped.category as JobCategory);
    }

    const nextSource = scraped.source?.trim();
    if (nextSource) {
      nextFetchedFields.push("source");
      nextPreview.push({ label: "Source", value: summarizeIntakeValue(nextSource) });
      setSource(nextSource);
    }

    const nextSalary = scraped.salary?.trim();
    if (nextSalary) {
      nextFetchedFields.push("salary");
      nextPreview.push({ label: "Salary", value: summarizeIntakeValue(nextSalary) });
      setSalary(nextSalary);
    }

    const nextContactEmail = scraped.contact_email?.trim();
    if (nextContactEmail) {
      nextFetchedFields.push("contact email");
      nextPreview.push({ label: "Contact email", value: summarizeIntakeValue(nextContactEmail) });
      setContactEmail(nextContactEmail);
    }

    const nextContactPhone = scraped.contact_phone?.trim();
    if (nextContactPhone) {
      nextFetchedFields.push("contact phone");
      nextPreview.push({ label: "Contact phone", value: summarizeIntakeValue(nextContactPhone) });
      setContactPhone(nextContactPhone);
    }

    const nextDescriptionEn = scraped.description_en?.trim();
    if (nextDescriptionEn) {
      nextFetchedFields.push("English description");
      nextPreview.push({ label: "English description", value: summarizeIntakeValue(nextDescriptionEn) });
      setDescriptionEn(nextDescriptionEn);
    }

    const nextDescriptionMm = scraped.description_mm?.trim() || nextDescriptionEn;
    if (nextDescriptionMm) {
      nextFetchedFields.push("Myanmar description");
      nextPreview.push({ label: "Myanmar description", value: summarizeIntakeValue(nextDescriptionMm) });
      setDescriptionMm(nextDescriptionMm);
    }

    const nextImageUrl = scraped.image_url?.trim();
    if (nextImageUrl) {
      nextFetchedFields.push("image");
      nextPreview.push({ label: "Image URL", value: summarizeIntakeValue(nextImageUrl, 86) });
      setImageUrl(nextImageUrl, { syncPreview: !selectedImageFile && !uploadedImageUrl });
    }

    setIntakeFields(nextFetchedFields);
    setIntakePreview(nextPreview);
    return nextFetchedFields;
  }

  async function fetchFromUrl() {
    const url = intakeUrl.trim();
    const intakeResult = jobIntakeUrlSchema.safeParse(url);
    if (!intakeResult.success) {
      const nextFieldError = intakeResult.error.issues[0]?.message || "Enter a valid job URL.";
      setUrlIntakeError(nextFieldError);
      const nextError = `Could not fill from this link. ${nextFieldError}`;
      setIntakeError(nextError);
      setIntakeMessage("");
      setIntakeFields([]);
      setIntakePreview([]);
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

        throw new Error(normalizedDetail || "Could not fill in this job from the link.");
      }

      const scraped = (await response.json()) as Partial<Job>;
      const nextFetchedFields = applyIntakePayload(scraped, { fallbackSourceUrl: url });
      const nextMessage =
        nextFetchedFields.length > 0
          ? "Details were filled in from the job link. Please review them before saving."
          : "The link opened, but we could not find enough job details. Please fill in the form yourself or try another link.";
      setIntakeMessage(nextMessage);
      toast.success(nextMessage);
    } catch (fetchError) {
      setIntakeFields([]);
      setIntakePreview([]);
      const nextError =
        fetchError instanceof DOMException && fetchError.name === "AbortError"
          ? "This job link took too long to respond. Please try again or use another link."
          : fetchError instanceof Error
            ? `Could not fill from this link. ${fetchError.message}`
            : "Could not fill from this link.";
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
      const nextError = "Upload an image before reading text from it.";
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
      setIntakePreview([]);
      toast.error(nextFileError);
      return;
    }

    setActiveIntakeMode("image");
    setOcrImageError("");
    resetIntakeFeedback();

    try {
      setIntakeMessage("Preparing the image...");
      const optimizedImage = await optimizeImageForOcr(ocrImageFile);
      const formData = new FormData();
      formData.append("image", optimizedImage);
      formData.append("ocr_mode", ocrMode);

      const extracted = await requestAdmin<Partial<Job>>("/api/admin/proxy/jobs/admin/jobs/ocr", {
        method: "POST",
        body: formData,
        fallbackError: "Could not read text from this image.",
      });

      const nextFetchedFields = applyIntakePayload(extracted);
      const nextMessage =
        nextFetchedFields.length > 0
          ? "Text was read from the image and the form was filled in. Please review it before saving."
          : "Text was read from the image, but it did not match the job form. Please fill in the details yourself.";
      setIntakeMessage(nextMessage);
      toast.success(nextMessage);
    } catch (extractError) {
      setIntakeFields([]);
      setIntakePreview([]);
      const nextError =
        extractError instanceof Error
          ? `Could not read text from this image. ${extractError.message}`
          : "Could not read text from this image.";
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
    const isFromApprovals = safeReturnTo === "/admin/approvals";
    const nextStatus: JobStatus =
      isFromApprovals && status === "pending-review" ? "draft" : status;
    const nextRequiresWebsiteApproval = isFromApprovals
      ? false
      : requiresWebsiteApproval;
    const nextRequiresFacebookApproval = isFromApprovals
      ? false
      : requiresFacebookApproval;

    const payload = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      employment_type: employmentType.trim(),
      salary: salary.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      status: nextStatus,
      category,
      source: source.trim() || "manual",
      source_url: sourceUrl.trim(),
      image_url: imageUrl.trim(),
      description_mm: descriptionMm.trim(),
      description_en: descriptionEn.trim(),
      is_active: isActive,
      requires_website_approval: nextRequiresWebsiteApproval,
      requires_facebook_approval: nextRequiresFacebookApproval,
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
      const nextMessage = isEdit
        ? isFromApprovals
          ? "Job reviewed and moved to Not live yet."
          : "Job updated."
        : "Job created.";
      setMessage(nextMessage);
      toast.success(nextMessage);
      if (isEdit && safeReturnTo) {
        router.push(safeReturnTo);
        router.refresh();
        return;
      }
      router.push(`/admin/jobs/${result.id}`);
    } catch (saveError) {
      const nextError = saveError instanceof Error ? saveError.message : "Unable to save job.";
      const mappedFieldErrors = mapJobEditorServerErrors(nextError);
      if (Object.keys(mappedFieldErrors).length > 0) {
        setFieldErrors((current) => ({
          ...current,
          ...mappedFieldErrors,
        }));
        const nextMessage = "Please fix the highlighted job fields.";
        setError(nextMessage);
        toast.error(nextMessage);
      } else {
        setError(nextError);
        toast.error(nextError);
      }
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

  function insertStructuredTemplate() {
    if (!descriptionEn.trim() && !descriptionMm.trim()) {
      setDescriptionEn(STRUCTURED_DESCRIPTION_TEMPLATE);
      setDescriptionMm(STRUCTURED_DESCRIPTION_TEMPLATE);
      clearFieldError("descriptionMm");
      return;
    }

    if (!descriptionEn.trim()) {
      setDescriptionEn(STRUCTURED_DESCRIPTION_TEMPLATE);
    }

    if (!descriptionMm.trim()) {
      setDescriptionMm(STRUCTURED_DESCRIPTION_TEMPLATE);
      clearFieldError("descriptionMm");
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
            <div className={eyebrowClass}>Fill from a job link</div>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgba(150,174,157,0.28)] bg-[#f8fbf9] text-[#5f7867]">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="grid gap-3">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Job URL</span>
              <div
                className={cn(
                  "flex h-11 items-center rounded-md border border-[rgba(150,174,157,0.28)] bg-white px-3 text-[#2f3d35] transition",
                  "focus-within:border-[rgba(116,141,122,0.45)]",
                  urlIntakeError
                    ? "border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]"
                    : "",
                )}
              >
                <Link2 className="h-4 w-4 shrink-0 text-[#6f8676]" />
                <input
                  className="h-full w-full border-0 bg-transparent px-2 text-sm text-[#2f3d35] outline-none placeholder:text-[#829189]"
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
                "w-full rounded-md border-[#6f8a75] from-[#7f9884] to-[#6f8775] text-[#fffaf3] hover:from-[#708b77] hover:to-[#617a68]",
                (isProcessingIntake || !canFetchFromUrl) && "cursor-not-allowed opacity-60",
              )}
              type="button"
              aria-busy={activeIntakeMode === "url"}
              disabled={isProcessingIntake || !canFetchFromUrl}
              onClick={() => void fetchFromUrl()}
            >
              {activeIntakeMode === "url" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {activeIntakeMode === "url" ? "Reading..." : "Fill from link"}
            </button>
          </div>
          <div className="grid gap-3">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Read text from an image</span>
              <Input
                className="h-auto rounded-md border-[rgba(150,174,157,0.28)] bg-white px-3 py-3 text-[#2f3d35] file:mr-3 file:rounded-md file:border-0 file:bg-[#edf3ee] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#33443b] hover:file:bg-[#e1ebe4]"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setOcrImageFile(nextFile);
                  setOcrImageError(nextFile ? validateJobImageFile(nextFile) : "");
                }}
              />
              <span className="text-sm leading-6 text-[#4f5d56]">
                Upload a screenshot, poster, or scan to pull the written details into the form.
              </span>
              <label className="grid gap-1">
                <span className="text-xs uppercase tracking-[0.12em] text-[#6f8676]">Mode</span>
                <select
                  className={selectClass}
                  value={ocrMode}
                  onChange={(event) => setOcrMode(event.target.value as (typeof OCR_MODE_OPTIONS)[number]["value"])}
                >
                  {OCR_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {ocrImageFile ? (
                <div className="flex items-center justify-between gap-3 rounded-md bg-[#edf3ee] px-3 py-2 text-sm text-[#3f5148]">
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
                "w-full rounded-md border-[rgba(150,174,157,0.3)] bg-[#f8fbf9] text-[#33443b] hover:bg-[#edf3ee]",
                (isProcessingIntake || !canExtractFromImage) && "cursor-not-allowed opacity-60",
              )}
              type="button"
              aria-busy={activeIntakeMode === "image"}
              disabled={isProcessingIntake || !canExtractFromImage}
              onClick={() => void extractFromImage()}
            >
              {activeIntakeMode === "image" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {activeIntakeMode === "image" ? "Reading image..." : "Read image text"}
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
                      ? "Reading the uploaded image..."
                      : "Reading the job link..."
                    : intakeError
                      ? "Could not load details"
                      : "Details loaded"}
                </strong>
                <span>
                  {isProcessingIntake
                    ? activeIntakeMode === "image"
                      ? `Reading the uploaded image in ${ocrMode} mode and filling in the job form.`
                      : "Checking the pasted job link and filling in the form."
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
              <div className="grid gap-2">
                <div className="text-xs uppercase tracking-[0.12em] text-[#5a6f60]">
                  Filled {intakeFields.length} fields
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {intakePreview.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(255,255,255,0.9)] px-2.5 py-2"
                    >
                      <div className="text-[11px] uppercase tracking-[0.12em] text-[#6b8272]">{item.label}</div>
                      <div className="mt-1 text-xs leading-5 text-[#43574b]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={panelClass}>
        <div>
          <div className={eyebrowClass}>Job details</div>
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
            <span className={eyebrowClass}>Added from</span>
            <Input
              className={inputClassName}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Added by hand"
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
            <span className={eyebrowClass}>Original job link</span>
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
            <span className={eyebrowClass}>Image link</span>
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
            <span className={eyebrowClass}>Upload an image</span>
            <label className="grid gap-3 rounded-md border border-dashed border-[rgba(160,183,164,0.22)] bg-[rgba(255,255,255,0.82)] px-4 py-4">
              <div className="flex items-start gap-3 text-sm text-[#5c645f]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[rgba(160,183,164,0.16)] bg-[rgba(247,243,236,0.66)] text-[#748d7a]">
                  <Upload className="h-4 w-4" />
                </span>
                <div className="grid gap-1">
                  <strong className="font-medium text-[#334039]">Upload a job image</strong>
                  <span>Allowed: JPG, PNG, WEBP, GIF. Max size 10 MB.</span>
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

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,0.85fr)]">
        <div className={panelClass}>
          <div>
            <div className={eyebrowClass}>Descriptions</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
              Job content
            </h2>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[rgba(160,183,164,0.12)] bg-[rgba(247,243,236,0.52)] px-3 py-2.5 text-sm text-[#56615c]">
              <span>
                A clear format works best: short headings, short paragraphs, and bullet points for the key details.
              </span>
              <button
                type="button"
                className={cn(buttonVariants({ variant: "secondary" }), "h-8 rounded-md px-3 text-xs")}
                onClick={insertStructuredTemplate}
              >
                Use sample text
              </button>
            </div>
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
          <div className="grid gap-4 2xl:grid-cols-2">
            <section className="grid gap-3 rounded-md border border-[rgba(160,183,164,0.12)] bg-[rgba(247,243,236,0.52)] p-4">
              <div>
                <div className={eyebrowClass}>Website preview</div>
                <h3 className="mt-1 text-[0.96rem] font-semibold text-foreground">
                  How this will look on the website
                </h3>
              </div>
              <div className="grid max-h-[520px] gap-4 overflow-auto pr-1 text-sm leading-7 text-[#5e6662]">
                {previewFacts.length > 0 ? (
                  <div className="grid gap-1 rounded-md border border-[rgba(160,183,164,0.14)] bg-[rgba(255,255,255,0.84)] p-3">
                    {previewFacts.map((fact) => (
                      <div key={`${fact.label}-${fact.value}`} className="break-words">
                        <span className="text-[#8a928d]">{fact.label}:</span> {fact.value}
                      </div>
                    ))}
                  </div>
                ) : null}
                {previewSections.length > 0 ? (
                  previewSections.map((section, index) => (
                    <section key={`${section.heading || "section"}-${index}`} className="grid gap-2">
                      {section.heading ? (
                        <h4 className="m-0 text-[0.78rem] uppercase tracking-[0.14em] text-[#4f6354]">
                          {section.heading}
                        </h4>
                      ) : null}
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={`paragraph-${index}-${paragraphIndex}`} className="mb-0 break-words">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets.length > 0 ? (
                        <ul className="m-0 grid gap-1.5 pl-5">
                          {section.bullets.map((bullet, bulletIndex) => (
                            <li key={`bullet-${index}-${bulletIndex}`} className="break-words">
                              {bullet.replace(/^- /, "")}
                            </li>
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
                  Suggested post text
                </h3>
              </div>
              <pre className="m-0 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-[rgba(255,255,255,0.86)] p-3 text-sm leading-7 text-[#334039]">
                {facebookPreview || "Suggested Facebook post text will appear here."}
              </pre>
            </section>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className={panelClass}>
            <div>
              <div className={eyebrowClass}>Image preview</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
                Job image
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
                    Add an image link or upload an image file to preview how this job will look.
                  </div>
                )}
              </div>
              <div className="grid gap-2 text-sm text-[#5c645f]">
                <span>
                  If both are added, the uploaded image will be used first.
                </span>
                {initialJob?.id && uploadedImageUrl ? (
                  <button
                    className="inline-flex items-center gap-2 text-left text-[#8e4a4a]"
                    type="button"
                    disabled={isRemovingImage}
                    onClick={() => void removeUploadedImage(initialJob?.id)}
                  >
                    <XCircle className="h-4 w-4" />
                    {isRemovingImage ? "Removing image..." : "Remove image"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div>
              <div className={eyebrowClass}>Visibility</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
                Where this job should appear
              </h2>
            </div>
            <label className="flex items-start justify-between gap-4">
              <span className="grid gap-1">
                <strong className="font-medium text-[#334039]">Show this job in lists</strong>
                <small className="text-[0.9rem] leading-6 text-[#727975]">
                  Turn this off if you want to hide the job from the website and admin lists.
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
                <strong className="font-medium text-[#334039]">Show on website now</strong>
                <small className="text-[0.9rem] leading-6 text-[#727975]">
                  Turn this on to show the job on the website right away. Turn it off to keep it waiting for review.
                </small>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                checked={!requiresWebsiteApproval}
                onChange={(event) => setRequiresWebsiteApproval(!event.target.checked)}
              />
            </label>
            <label className="flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.12)] pt-4">
              <span className="grid gap-1">
                <strong className="font-medium text-[#334039]">Post to Facebook now</strong>
                <small className="text-[0.9rem] leading-6 text-[#727975]">
                  Turn this on to post after saving. Turn it off to keep it waiting for review.
                </small>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                checked={!requiresFacebookApproval}
                onChange={(event) => setRequiresFacebookApproval(!event.target.checked)}
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
                  ? "Please complete the required job details before saving."
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
                  ? "Save changes"
                  : "Add job"}
            </button>
            {initialJob?.id ? (
              <button
                className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            ) : null}
          </div>
        </aside>
      </section>
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Remove job"
        description="This will permanently remove this job from the admin dashboard."
        confirmLabel="Remove"
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
