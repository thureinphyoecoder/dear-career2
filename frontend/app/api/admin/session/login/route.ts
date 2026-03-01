import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCredentials,
  getSessionDurationMs,
  isAdminAuthConfigured,
} from "@/lib/admin-auth";

function buildRedirect(request: NextRequest, target: string) {
  return NextResponse.redirect(new URL(target, request.url));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  if (!isAdminAuthConfigured()) {
    return buildRedirect(request, "/admin/login?error=config");
  }

  const credentials = getAdminCredentials();
  if (username !== credentials.username || password !== credentials.password) {
    const target = new URL("/admin/login", request.url);
    target.searchParams.set("error", "invalid");
    if (redirectTo.startsWith("/")) {
      target.searchParams.set("redirect", redirectTo);
    }
    return NextResponse.redirect(target);
  }

  const token = await createAdminSessionToken(username);
  const response = buildRedirect(
    request,
    redirectTo.startsWith("/") ? redirectTo : "/admin",
  );

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(getSessionDurationMs() / 1000),
  });

  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return NextResponse.json({ authenticated: Boolean(token) });
}
