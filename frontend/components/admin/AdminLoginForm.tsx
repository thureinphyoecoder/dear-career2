"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_LOGIN_MESSAGES,
  AdminLoginFieldErrors,
  validateAdminLoginFields,
} from "@/lib/admin-login-validation";

function EyeIcon({ crossed = false }: { crossed?: boolean }) {
  return crossed ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58A2 2 0 0013.41 13.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.36 5.37A9.93 9.93 0 0112 5c5 0 9.27 3.11 11 7-.42.92-.99 1.77-1.68 2.52"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.23 6.23C4.27 7.48 2.74 9.15 2 12c1.73 3.89 6 7 10 7 1.61 0 3.15-.36 4.53-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12C3.73 8.11 8 5 12 5s8.27 3.11 10 7c-1.73 3.89-6 7-10 7S3.73 15.89 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function AdminLoginForm({
  redirectTo,
  error,
}: {
  redirectTo: string;
  error?: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AdminLoginFieldErrors>({});
  const [formError, setFormError] = useState(error ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setSingleFieldError(name: keyof AdminLoginFieldErrors, value: string) {
    const nextErrors = validateAdminLoginFields({
      username: name === "username" ? value : username,
      password: name === "password" ? value : password,
    });

    setFieldErrors((current) => ({
      ...current,
      [name]: nextErrors[name] ?? "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const nextFieldErrors = validateAdminLoginFields({ username, password });
    setFieldErrors(nextFieldErrors);

    if (Object.values(nextFieldErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("username", username.trim());
      formData.set("password", password);
      formData.set("redirect", redirectTo);

      const response = await fetch("/api/admin/session/login", {
        method: "POST",
        body: formData,
        headers: {
          "x-admin-auth-mode": "json",
        },
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        redirectTo?: string;
        formError?: string;
        fieldErrors?: AdminLoginFieldErrors;
      };

      if (!response.ok || !payload.ok) {
        setFieldErrors(payload.fieldErrors ?? {});
        setFormError(payload.formError ?? ADMIN_LOGIN_MESSAGES.generic);
        return;
      }

      startTransition(() => {
        router.push(payload.redirectTo || redirectTo);
        router.refresh();
      });
    } catch {
      setFormError(ADMIN_LOGIN_MESSAGES.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4"
      action="/api/admin/session/login"
      method="post"
      onSubmit={handleSubmit}
      noValidate
    >
      <input type="hidden" name="redirect" value={redirectTo} />
      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Username</span>
        <Input
          className={
            fieldErrors.username
              ? "border-[rgba(205,111,111,0.5)] shadow-[0_0_0_4px_rgba(205,111,111,0.08)]"
              : "bg-[rgba(255,255,255,0.88)]"
          }
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? "admin-login-username-error" : undefined}
          autoFocus
          onChange={(event) => {
            setUsername(event.target.value);
            setFieldErrors((current) => ({ ...current, username: "" }));
            if (formError) {
              setFormError("");
            }
          }}
          onBlur={(event) => setSingleFieldError("username", event.target.value)}
        />
        {fieldErrors.username ? (
          <span id="admin-login-username-error" className="text-[0.82rem] leading-6 text-[#8e4a4a]">
            {fieldErrors.username}
          </span>
        ) : null}
      </label>
      <label className="grid gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Password</span>
        <span className="relative block">
          <Input
            className={
              fieldErrors.password
                ? "bg-[rgba(255,255,255,0.88)] pr-14 border-[rgba(205,111,111,0.5)] shadow-[0_0_0_4px_rgba(205,111,111,0.08)]"
                : "bg-[rgba(255,255,255,0.88)] pr-14"
            }
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "admin-login-password-error" : undefined}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: "" }));
              if (formError) {
                setFormError("");
              }
            }}
            onBlur={(event) => setSingleFieldError("password", event.target.value)}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#727975]/82 transition-colors hover:bg-[rgba(160,183,164,0.12)] hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            <EyeIcon crossed={showPassword} />
          </button>
        </span>
        {fieldErrors.password ? (
          <span id="admin-login-password-error" className="text-[0.82rem] leading-6 text-[#8e4a4a]">
            {fieldErrors.password}
          </span>
        ) : null}
      </label>
      {formError ? (
        <p className="rounded-[14px] border border-[rgba(205,111,111,0.18)] bg-[rgba(205,111,111,0.1)] px-4 py-3 text-sm text-[#8e4a4a]">
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="h-[52px] w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
