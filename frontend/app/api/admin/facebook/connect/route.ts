import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAdminApiHeaders } from "@/lib/admin-api-auth";

const FACEBOOK_STATE_COOKIE = "dear_career_fb_oauth_state";
const FACEBOOK_PAGES_COOKIE = "dear_career_fb_oauth_pages";
const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const FACEBOOK_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
].join(",");

async function getFacebookAppId() {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`, {
      cache: "no-store",
      headers: getAdminApiHeaders(
        new Headers({
          accept: "application/json",
          "x-facebook-config-mode": "internal",
        }),
      ),
    });
    if (response.ok) {
      const payload = (await response.json()) as { app_id?: string };
      if (payload.app_id?.trim()) {
        return payload.app_id.trim();
      }
    }
  } catch {
    // Fall back to env-based config below.
  }

  return process.env.FACEBOOK_APP_ID ?? "";
}

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const appId = await getFacebookAppId();
  if (!appId) {
    return NextResponse.redirect(new URL("/admin/facebook?error=missing-app-config", request.url));
  }

  const state = randomUUID();
  const redirectUri = `${getBaseUrl(request)}/api/admin/facebook/callback`;
  const oauthUrl = new URL("https://www.facebook.com/v23.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id", appId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("scope", FACEBOOK_OAUTH_SCOPES);
  oauthUrl.searchParams.set("auth_type", "rerequest");
  oauthUrl.searchParams.set("return_scopes", "true");

  const response = NextResponse.redirect(oauthUrl);
  response.headers.set("cache-control", "no-store");
  response.cookies.set({
    name: FACEBOOK_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
    priority: "high",
  });
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

export async function POST(request: NextRequest) {
  return GET(request);
}
