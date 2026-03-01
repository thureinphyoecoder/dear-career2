import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  isAdminAuthConfigured,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("cross-origin-opener-policy", "same-origin");
  response.headers.set("cross-origin-resource-policy", "same-origin");
  response.headers.set("cache-control", "no-store");
  response.headers.set(
    "content-security-policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';",
  );
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isSessionLogin = pathname === "/api/admin/session/login";
  const isSessionLogout = pathname === "/api/admin/session/logout";

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (!isAdminAuthConfigured()) {
    if (isLoginPage || isSessionLogin || isSessionLogout) {
      return applySecurityHeaders(NextResponse.next());
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "config");
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionToken(token);

  if (session.valid) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (isLoginPage || isSessionLogin || isSessionLogout) {
    return applySecurityHeaders(NextResponse.next());
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return applySecurityHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
