import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCredentials,
  getSessionDurationMs,
  isAdminAuthConfigured,
} from "@/lib/admin-auth";
import {
  buildAdminRateLimitKey,
  clearAdminLoginFailures,
  getAdminRateLimitState,
  registerAdminLoginFailure,
} from "@/lib/admin-rate-limit";
import {
  ADMIN_LOGIN_MESSAGES,
  hasAdminLoginErrors,
  validateAdminLoginFields,
} from "@/lib/admin-login-validation";
import { verifyAdminPassword } from "@/lib/admin-password";

function getAppOrigin(request: NextRequest) {
  return parseOrigin(process.env.NEXT_PUBLIC_APP_URL ?? "") || request.nextUrl.origin;
}

function buildRedirect(request: NextRequest, target: string) {
  return NextResponse.redirect(new URL(target, getAppOrigin(request)));
}

function wantsJsonResponse(request: NextRequest) {
  return request.headers.get("x-admin-auth-mode") === "json";
}

function parseOrigin(value: string | null) {
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function addOriginVariants(trusted: Set<string>, value: string) {
  if (!value) return;
  trusted.add(value);
  try {
    const url = new URL(value);
    const alternate = new URL(value);
    alternate.protocol = url.protocol === "https:" ? "http:" : "https:";
    trusted.add(alternate.origin);
  } catch {
    // Ignore invalid origins and keep the explicitly configured one.
  }
}

function buildTrustedOrigins(request: NextRequest) {
  const trusted = new Set<string>();
  addOriginVariants(trusted, request.nextUrl.origin);
  const appUrlOrigin = parseOrigin(process.env.NEXT_PUBLIC_APP_URL ?? "");
  if (appUrlOrigin) {
    addOriginVariants(trusted, appUrlOrigin);
  }

  if (process.env.NODE_ENV !== "production") {
    trusted.add("http://localhost:3000");
    trusted.add("http://127.0.0.1:3000");
    trusted.add("http://0.0.0.0:3000");
  }

  return trusted;
}

function hasTrustedOrigin(request: NextRequest) {
  const trustedOrigins = buildTrustedOrigins(request);
  const origin = parseOrigin(request.headers.get("origin"));
  const referer = parseOrigin(request.headers.get("referer"));

  if (origin) {
    return trustedOrigins.has(origin);
  }

  if (referer) {
    return trustedOrigins.has(referer);
  }

  return process.env.NODE_ENV !== "production";
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json(
      { ok: false, formError: ADMIN_LOGIN_MESSAGES.generic },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");
  const fieldErrors = validateAdminLoginFields({ username, password });
  const expectsJson = wantsJsonResponse(request);
  const rateLimitKey = buildAdminRateLimitKey(getClientIp(request), username);
  const rateLimit = getAdminRateLimitState(rateLimitKey);

  if (!isAdminAuthConfigured()) {
    if (expectsJson) {
      return NextResponse.json(
        { ok: false, formError: ADMIN_LOGIN_MESSAGES.config },
        { status: 500 },
      );
    }
    return buildRedirect(request, "/admin/login?error=config");
  }

  if (hasAdminLoginErrors(fieldErrors)) {
    if (expectsJson) {
      return NextResponse.json(
        { ok: false, fieldErrors },
        { status: 422 },
      );
    }

    const target = new URL("/admin/login", getAppOrigin(request));
    target.searchParams.set("error", "invalid");
    if (redirectTo.startsWith("/")) {
      target.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(target);
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        formError: "Too many attempts. Please wait and try again.",
      },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000)),
        },
      },
    );
  }

  const credentials = getAdminCredentials();
  if (username !== credentials.username || !verifyAdminPassword(password)) {
    registerAdminLoginFailure(rateLimitKey);
    if (expectsJson) {
      return NextResponse.json(
        { ok: false, formError: ADMIN_LOGIN_MESSAGES.invalidCredentials },
        { status: 401 },
      );
    }
    const target = new URL("/admin/login", getAppOrigin(request));
    target.searchParams.set("error", "invalid");
    if (redirectTo.startsWith("/")) {
      target.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(target);
  }

  clearAdminLoginFailures(rateLimitKey);
  const token = await createAdminSessionToken(username);
  const cookieOptions = {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(getSessionDurationMs() / 1000),
    priority: "high" as const,
  };

  if (expectsJson) {
    const jsonResponse = NextResponse.json({
      ok: true,
      redirectTo: redirectTo.startsWith("/") ? redirectTo : "/admin",
    });
    jsonResponse.cookies.set(cookieOptions);
    return jsonResponse;
  }

  const response = buildRedirect(
    request,
    redirectTo.startsWith("/") ? redirectTo : "/admin",
  );
  response.cookies.set(cookieOptions);
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return NextResponse.json(
    { authenticated: Boolean(token) },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
