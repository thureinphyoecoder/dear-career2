import { z } from "zod";

export const ADMIN_LOGIN_MESSAGES = {
  invalidCredentials: "Incorrect username or password.",
  generic: "Unable to sign in right now. Please try again.",
  config: "Admin login is not configured yet.",
} as const;

export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required.")
    .min(3, "Username must be at least 3 characters."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export type AdminLoginFields = z.input<typeof adminLoginSchema>;

export type AdminLoginFieldErrors = Partial<
  Record<keyof AdminLoginFields, string>
>;

export function validateAdminLoginFields(
  fields: AdminLoginFields,
): AdminLoginFieldErrors {
  const result = adminLoginSchema.safeParse(fields);

  if (result.success) {
    return {};
  }

  const flattened = result.error.flatten().fieldErrors;

  return {
    username: flattened.username?.[0],
    password: flattened.password?.[0],
  };
}

export function hasAdminLoginErrors(errors: AdminLoginFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
