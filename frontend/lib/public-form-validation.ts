import { z } from "zod";

export const feedbackFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  subject: z.string().trim().min(1, "Enter a subject."),
  message: z
    .string()
    .trim()
    .min(1, "Write your feedback.")
    .min(10, "Add a bit more detail."),
});

export type FeedbackFormFields = z.input<typeof feedbackFormSchema>;
export type FeedbackFormFieldErrors = Partial<Record<keyof FeedbackFormFields, string>>;

export function validateFeedbackFormFields(
  fields: FeedbackFormFields,
): FeedbackFormFieldErrors {
  const result = feedbackFormSchema.safeParse(fields);

  if (result.success) {
    return {};
  }

  const flattened = result.error.flatten().fieldErrors;

  return {
    name: flattened.name?.[0],
    email: flattened.email?.[0],
    subject: flattened.subject?.[0],
    message: flattened.message?.[0],
  };
}
