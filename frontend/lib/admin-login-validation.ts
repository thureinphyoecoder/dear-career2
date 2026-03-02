import { z } from "zod";

export const ADMIN_LOGIN_MESSAGES = {
  invalidCredentials: "Sign-in failed. Check your username and password, then try again.",
  generic: "Sign-in could not be completed right now. Please try again in a moment.",
  config: "Admin login is not configured yet.",
} as const;

export const adminLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Enter your admin username.")
    .min(3, "Username looks too short. Use at least 3 characters."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .min(8, "Password looks too short. Use at least 8 characters."),
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
