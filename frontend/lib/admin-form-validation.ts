import { z } from "zod";

const optionalUrlField = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Enter a valid source URL.");

const optionalEmailField = z
  .string()
  .trim()
  .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid contact email.");

export const jobIntakeUrlSchema = z
  .string()
  .trim()
  .min(1, "Paste a job URL before fetching.")
  .refine((value) => /^https?:\/\/.+/i.test(value), "Enter a valid job URL.");

export const jobEditorSchema = z.object({
  title: z.string().trim().min(1, "Enter a job title."),
  company: z.string().trim().min(1, "Enter a company name."),
  location: z.string().trim().min(1, "Enter a location."),
  descriptionMm: z.string().trim().min(1, "Enter a Myanmar description."),
  sourceUrl: optionalUrlField,
  contactEmail: optionalEmailField,
});

export type JobEditorFields = z.input<typeof jobEditorSchema>;

export type JobEditorFieldErrors = Partial<Record<keyof JobEditorFields, string>>;

export function validateJobEditorFields(fields: JobEditorFields): JobEditorFieldErrors {
  const result = jobEditorSchema.safeParse(fields);

  if (result.success) {
    return {};
  }

  const flattened = result.error.flatten().fieldErrors;

  return {
    title: flattened.title?.[0],
    company: flattened.company?.[0],
    location: flattened.location?.[0],
    descriptionMm: flattened.descriptionMm?.[0],
    sourceUrl: flattened.sourceUrl?.[0],
    contactEmail: flattened.contactEmail?.[0],
  };
}

export const facebookPublishSchema = z.object({
  selectedJobId: z.string().trim().min(1, "Choose a published job first."),
  message: z.string().trim().min(1, "Write the post caption before publishing."),
});

export type FacebookPublishFields = z.input<typeof facebookPublishSchema>;

export type FacebookPublishFieldErrors = Partial<Record<keyof FacebookPublishFields, string>>;

export function validateFacebookPublishFields(
  fields: FacebookPublishFields,
): FacebookPublishFieldErrors {
  const result = facebookPublishSchema.safeParse(fields);

  if (result.success) {
    return {};
  }

  const flattened = result.error.flatten().fieldErrors;

  return {
    selectedJobId: flattened.selectedJobId?.[0],
    message: flattened.message?.[0],
  };
}

export const sourceCreateSchema = z.object({
  feed_url: z
    .string()
    .trim()
    .min(1, "Paste a source URL first.")
    .refine((value) => /^https?:\/\/.+/i.test(value), "Enter a valid feed URL."),
});

export type SourceCreateFields = z.input<typeof sourceCreateSchema>;
export type SourceCreateFieldErrors = Partial<Record<keyof SourceCreateFields, string>>;

export function validateSourceCreateFields(fields: SourceCreateFields): SourceCreateFieldErrors {
  const result = sourceCreateSchema.safeParse(fields);
  if (result.success) return {};
  const flattened = result.error.flatten().fieldErrors;
  return {
    feed_url: flattened.feed_url?.[0],
  };
}

export const sourceEditSchema = z.object({
  label: z.string().trim().min(1, "Enter a source label."),
  domain: z.string().trim().min(1, "Enter a source domain."),
  feed_url: optionalUrlField,
  cadence_value: z.number().finite().gte(0, "Cadence must be zero or higher."),
  max_jobs_per_run: z.number().finite().gte(1, "Max jobs per run must be at least 1."),
});

export type SourceEditFields = z.input<typeof sourceEditSchema>;
export type SourceEditFieldErrors = Partial<Record<keyof SourceEditFields, string>>;

export function validateSourceEditFields(fields: SourceEditFields): SourceEditFieldErrors {
  const result = sourceEditSchema.safeParse(fields);
  if (result.success) return {};
  const flattened = result.error.flatten().fieldErrors;
  return {
    label: flattened.label?.[0],
    domain: flattened.domain?.[0],
    feed_url: flattened.feed_url?.[0],
    cadence_value: flattened.cadence_value?.[0],
    max_jobs_per_run: flattened.max_jobs_per_run?.[0],
  };
}

export const manualSourceIntakeSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a job URL first.")
    .refine((value) => /^https?:\/\/.+/i.test(value), "Enter a valid job URL."),
});

export type ManualSourceIntakeFields = z.input<typeof manualSourceIntakeSchema>;
export type ManualSourceIntakeFieldErrors = Partial<Record<keyof ManualSourceIntakeFields, string>>;

export function validateManualSourceIntakeFields(
  fields: ManualSourceIntakeFields,
): ManualSourceIntakeFieldErrors {
  const result = manualSourceIntakeSchema.safeParse(fields);
  if (result.success) return {};
  const flattened = result.error.flatten().fieldErrors;
  return {
    url: flattened.url?.[0],
  };
}

export const fetchSettingsSchema = z.object({
  cadenceValue: z.number().finite().gte(1, "Run interval must be at least 1."),
  maxJobsPerRun: z.number().finite().gte(1, "Max jobs per run must be at least 1."),
});

export type FetchSettingsFields = z.input<typeof fetchSettingsSchema>;
export type FetchSettingsFieldErrors = Partial<Record<keyof FetchSettingsFields, string>>;

export function validateFetchSettingsFields(
  fields: FetchSettingsFields,
): FetchSettingsFieldErrors {
  const result = fetchSettingsSchema.safeParse(fields);
  if (result.success) return {};
  const flattened = result.error.flatten().fieldErrors;
  return {
    cadenceValue: flattened.cadenceValue?.[0],
    maxJobsPerRun: flattened.maxJobsPerRun?.[0],
  };
}

const adHrefSchema = z
  .string()
  .trim()
  .min(1, "Enter the target URL.")
  .refine((value) => value.startsWith("/") || /^https?:\/\/.+/i.test(value), "Enter a valid URL or internal path.");

export const adSchema = z.object({
  title: z.string().trim().min(1, "Enter an ad title."),
  cta_label: z.string().trim().min(1, "Enter a CTA label."),
  description: z.string().trim().min(1, "Enter a short ad description."),
  href: adHrefSchema,
  sort_order: z.number().finite().gte(0, "Sort order must be zero or higher."),
});

export type AdFields = z.input<typeof adSchema>;
export type AdFieldErrors = Partial<Record<keyof AdFields, string>>;

export function validateAdFields(fields: AdFields): AdFieldErrors {
  const result = adSchema.safeParse(fields);
  if (result.success) return {};
  const flattened = result.error.flatten().fieldErrors;
  return {
    title: flattened.title?.[0],
    cta_label: flattened.cta_label?.[0],
    description: flattened.description?.[0],
    href: flattened.href?.[0],
    sort_order: flattened.sort_order?.[0],
  };
}
