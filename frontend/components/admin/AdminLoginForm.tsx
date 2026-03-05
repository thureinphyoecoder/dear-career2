"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_LOGIN_MESSAGES,
  AdminLoginFieldErrors,
  validateAdminLoginFields,
} from "@/lib/admin-login-validation";

export function AdminLoginForm({
  redirectTo,
  error,
}: {
  redirectTo: string;
  error?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AdminLoginFieldErrors>({});
  const [formError, setFormError] = useState(error ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof AdminLoginFieldErrors, boolean>>
  >({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const baseInputClassName =
    "admin-login-input rounded-[6px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";

  function setSingleFieldError(
    name: keyof AdminLoginFieldErrors,
    value: string,
    options?: { force?: boolean },
  ) {
    const shouldValidate = options?.force || value.trim().length > 0;

    if (!shouldValidate) {
      setFieldErrors((current) => ({
        ...current,
        [name]: "",
      }));
      return;
    }

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
    setHasSubmitted(true);
    setTouchedFields({
      username: true,
      password: true,
    });

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

      const nextLocation = payload.redirectTo || redirectTo;
      window.location.assign(nextLocation);
    } catch {
      setFormError(ADMIN_LOGIN_MESSAGES.generic);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="admin-login-form"
      action="/api/admin/session/login"
      method="post"
      onSubmit={handleSubmit}
      noValidate
    >
      <input type="hidden" name="redirect" value={redirectTo} />
      <label className="admin-login-field">
        <span className="admin-login-label">Username</span>
        <Input
          className={
            fieldErrors.username
              ? `${baseInputClassName} border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]`
              : baseInputClassName
          }
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Admin username"
          value={username}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? "admin-login-username-error" : undefined}
          autoFocus
          onChange={(event) => {
            const nextValue = event.target.value;
            setUsername(nextValue);
            if (touchedFields.username || hasSubmitted) {
              setSingleFieldError("username", nextValue, { force: true });
            } else {
              setFieldErrors((current) => ({ ...current, username: "" }));
            }
            if (formError) {
              setFormError("");
            }
          }}
          onBlur={(event) => {
            setTouchedFields((current) => ({ ...current, username: true }));
            setSingleFieldError("username", event.target.value);
          }}
        />
        {fieldErrors.username ? (
          <span id="admin-login-username-error" className="admin-login-error">
            {fieldErrors.username}
          </span>
        ) : null}
      </label>
      <label className="admin-login-field">
        <span className="admin-login-label">Password</span>
        <span className="relative block">
          <Input
            className={
              fieldErrors.password
                ? `${baseInputClassName} pr-16 border-[rgba(169,97,111,0.34)] shadow-[0_0_0_3px_rgba(169,97,111,0.1)]`
                : `${baseInputClassName} pr-16`
            }
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "admin-login-password-error" : undefined}
            onChange={(event) => {
              const nextValue = event.target.value;
              setPassword(nextValue);
              if (touchedFields.password || hasSubmitted) {
                setSingleFieldError("password", nextValue, { force: true });
              } else {
                setFieldErrors((current) => ({ ...current, password: "" }));
              }
              if (formError) {
                setFormError("");
              }
            }}
            onBlur={(event) => {
              setTouchedFields((current) => ({ ...current, password: true }));
              setSingleFieldError("password", event.target.value);
            }}
          />
          <button
            type="button"
            className={`absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-200 ${
              showPassword
                ? "scale-105 border-[rgba(116,141,122,0.28)] bg-[rgba(144,168,147,0.22)] text-[#5c7162] shadow-[0_8px_20px_rgba(116,141,122,0.16)]"
                : "border-[rgba(144,168,147,0.18)] bg-[rgba(255,253,249,0.96)] text-[#8a968c] hover:border-[rgba(144,168,147,0.22)] hover:bg-[rgba(144,168,147,0.08)]"
            }`}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            title={showPassword ? "Hide password" : "Show password"}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <Eye
                key="password-visible"
                size={19}
                strokeWidth={2.35}
                className="animate-[eyeOpenPop_220ms_ease-out]"
              />
            ) : (
              <EyeOff
                key="password-hidden"
                size={19}
                strokeWidth={2.35}
                className="animate-[eyeClosedPop_180ms_ease-out]"
              />
            )}
          </button>
        </span>
        {fieldErrors.password ? (
          <span id="admin-login-password-error" className="admin-login-error">
            {fieldErrors.password}
          </span>
        ) : null}
      </label>
      {formError ? (
        <p role="alert" className="admin-login-form-error">
          {formError}
        </p>
      ) : null}
      <Button type="submit" className="admin-login-submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
