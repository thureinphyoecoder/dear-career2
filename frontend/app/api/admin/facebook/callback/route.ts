import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const FACEBOOK_STATE_COOKIE = "dear_career_fb_oauth_state";
const GRAPH_API_BASE = "https://graph.facebook.com/v23.0";
const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";

type FacebookPageAccount = {
  id: string;
  name: string;
  access_token: string;
};

type FacebookUserProfile = {
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
};

function getFacebookAppId() {
  return process.env.FACEBOOK_APP_ID ?? "";
}

function getFacebookAppSecret() {
  return process.env.FACEBOOK_APP_SECRET ?? "";
}

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

async function fetchJson<T>(url: URL) {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.text();
  let parsed: unknown = null;

  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed && "error" in parsed
        ? String((parsed as { error?: { message?: string } }).error?.message || "")
        : body;
    throw new Error(message || "Facebook connection failed.");
  }

  return parsed as T;
}

export async function GET(request: NextRequest) {
  const appId = getFacebookAppId();
  const appSecret = getFacebookAppSecret();
  if (!appId || !appSecret) {
    return NextResponse.redirect(new URL("/admin/facebook?error=missing-app-config", request.url));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(FACEBOOK_STATE_COOKIE)?.value;
  const returnedState = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL("/admin/facebook?error=facebook-denied", request.url));
  }
  if (!expectedState || expectedState !== returnedState) {
    return NextResponse.redirect(new URL("/admin/facebook?error=invalid-state", request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/admin/facebook?error=missing-code", request.url));
  }

  try {
    const redirectUri = `${getBaseUrl(request)}/api/admin/facebook/callback`;

    const tokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenPayload = await fetchJson<{ access_token: string }>(tokenUrl);

    const pagesUrl = new URL(`${GRAPH_API_BASE}/me/accounts`);
    pagesUrl.searchParams.set("access_token", tokenPayload.access_token);
    pagesUrl.searchParams.set("fields", "id,name,access_token");

    const pagesPayload = await fetchJson<{ data?: FacebookPageAccount[] }>(pagesUrl);
    const profileUrl = new URL(`${GRAPH_API_BASE}/me`);
    profileUrl.searchParams.set("access_token", tokenPayload.access_token);
    profileUrl.searchParams.set("fields", "name,picture.type(normal)");
    const profilePayload = await fetchJson<FacebookUserProfile>(profileUrl);
    const pages = pagesPayload.data ?? [];
    if (pages.length === 0) {
      throw new Error("No Facebook pages were available for this account.");
    }

    const currentCredentialResponse = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });
    const currentCredential = currentCredentialResponse.ok
      ? ((await currentCredentialResponse.json()) as { page_id?: string })
      : null;

    const selectedPage =
      pages.find((page) => page.id === currentCredential?.page_id) || pages[0];

    const saveResponse = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        account_name: selectedPage.name,
        page_id: selectedPage.id,
        access_token: selectedPage.access_token,
        profile_name: profilePayload.name ?? "",
        profile_image_url: profilePayload.picture?.data?.url ?? "",
      }),
    });

    if (!saveResponse.ok) {
      throw new Error("Facebook page credential could not be saved.");
    }

    const response = NextResponse.redirect(new URL("/admin/facebook?connected=1", request.url));
    response.cookies.set({
      name: FACEBOOK_STATE_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      priority: "high",
    });
    return response;
  } catch (error) {
    const target = new URL("/admin/facebook", request.url);
    target.searchParams.set(
      "error",
      error instanceof Error && error.message ? error.message : "facebook-connect-failed",
    );
    const response = NextResponse.redirect(target);
    response.cookies.set({
      name: FACEBOOK_STATE_COOKIE,
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
}
