import { NextRequest, NextResponse } from "next/server";

import { getAdminApiHeaders } from "@/lib/admin-api-auth";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";

function wantsJsonResponse(request: NextRequest) {
  return request.headers.get("x-facebook-disconnect-mode") === "json";
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`, {
      method: "DELETE",
      cache: "no-store",
      headers: getAdminApiHeaders(new Headers({ accept: "application/json" })),
    });

    if (!response.ok) {
      const message = (await response.text()).trim();
      if (wantsJsonResponse(request)) {
        return NextResponse.json(
          { ok: false, error: message || "facebook-disconnect-failed" },
          { status: response.status || 400 },
        );
      }
      const target = new URL("/admin/facebook", request.url);
      target.searchParams.set("error", message || "facebook-disconnect-failed");
      return NextResponse.redirect(target, 303);
    }

    if (wantsJsonResponse(request)) {
      return NextResponse.json({ ok: true, disconnected: true });
    }

    return NextResponse.redirect(new URL("/admin/facebook?disconnected=1", request.url), 303);
  } catch {
    if (wantsJsonResponse(request)) {
      return NextResponse.json(
        { ok: false, error: "facebook-disconnect-failed" },
        { status: 500 },
      );
    }
    return NextResponse.redirect(
      new URL("/admin/facebook?error=facebook-disconnect-failed", request.url),
      303,
    );
  }
}
