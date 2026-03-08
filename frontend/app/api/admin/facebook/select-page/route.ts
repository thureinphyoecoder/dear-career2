import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAdminApiHeaders } from "@/lib/admin-api-auth";

const FACEBOOK_PAGES_COOKIE = "dear_career_fb_oauth_pages";
const GRAPH_API_BASE = "https://graph.facebook.com/v23.0";
const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";

type FacebookPageAccount = {
  id: string;
  name: string;
  access_token: string;
};

type PendingFacebookPageSelection = {
  pages: FacebookPageAccount[];
  profileName: string;
  profileImageUrl: string;
  grantedScopes: string;
};

function buildRedirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const rawPending = cookieStore.get(FACEBOOK_PAGES_COOKIE)?.value ?? "";

  if (!rawPending) {
    return buildRedirect(request, "/admin/facebook?error=facebook-page-selection-expired");
  }

  let pending: PendingFacebookPageSelection | null = null;
  try {
    pending = JSON.parse(decodeURIComponent(rawPending)) as PendingFacebookPageSelection;
  } catch {
    pending = null;
  }

  if (!pending || !Array.isArray(pending.pages) || pending.pages.length === 0) {
    return buildRedirect(request, "/admin/facebook?error=facebook-page-selection-expired");
  }

  const formData = await request.formData();
  const selectedPageId = String(formData.get("page_id") ?? "").trim();
  const selectedPage = pending.pages.find((page) => page.id === selectedPageId);

  if (!selectedPage) {
    return buildRedirect(request, "/admin/facebook?error=facebook-page-selection-invalid");
  }

  const saveResponse = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`, {
    method: "PATCH",
    headers: getAdminApiHeaders(
      new Headers({
        "content-type": "application/json",
      }),
    ),
    body: JSON.stringify({
      account_name: selectedPage.name,
      page_id: selectedPage.id,
      access_token: selectedPage.access_token,
      profile_name: pending.profileName ?? "",
      profile_image_url: pending.profileImageUrl ?? "",
    }),
  });

  if (!saveResponse.ok) {
    return buildRedirect(request, "/admin/facebook?error=facebook-page-save-failed");
  }

  const target = new URL("/admin/facebook?connected=1", request.url);

  const response = NextResponse.redirect(target, 303);
  response.cookies.set({
    name: FACEBOOK_PAGES_COOKIE,
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
