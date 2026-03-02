import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const FACEBOOK_STATE_COOKIE = "dear_career_fb_oauth_state";
const FACEBOOK_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
].join(",");

function getFacebookAppId() {
  return process.env.FACEBOOK_APP_ID ?? "";
}

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const appId = getFacebookAppId();
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

  const response = NextResponse.redirect(oauthUrl);
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
  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
