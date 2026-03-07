import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

function getAppOrigin(request: NextRequest) {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").origin;
  } catch {
    return request.nextUrl.origin;
  }
}

function isTrustedOrigin(request: NextRequest, value: string | null) {
  if (!value) return false;

  const trusted = new Set<string>();
  for (const candidate of [request.nextUrl.origin, getAppOrigin(request)]) {
    try {
      const url = new URL(candidate);
      trusted.add(url.origin);
      url.protocol = url.protocol === "https:" ? "http:" : "https:";
      trusted.add(url.origin);
    } catch {
      // Skip malformed origins and keep checking the rest.
    }
  }

  return trusted.has(value);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!isTrustedOrigin(request, origin)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const formData = await request.formData();
  const redirectTo = String(formData.get("redirect") ?? "/admin/login");
  const response = NextResponse.redirect(
    new URL(redirectTo.startsWith("/") ? redirectTo : "/admin/login", getAppOrigin(request)),
  );

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    priority: "high",
  });

  return response;
}
