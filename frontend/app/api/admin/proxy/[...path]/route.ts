import { NextRequest, NextResponse } from "next/server";

import { getAdminApiHeaders } from "@/lib/admin-api-auth";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const ADMIN_PROXY_READ_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 4000 : 2000;
const ADMIN_PROXY_WRITE_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 20000 : 20000;
const ADMIN_PROXY_OCR_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 120000 : 120000;
const ADMIN_PROXY_SCRAPE_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 45000 : 45000;

function getProxyTimeoutMs(request: NextRequest, normalizedPath: string) {
  if (normalizedPath.endsWith("jobs/ocr")) {
    return ADMIN_PROXY_OCR_TIMEOUT_MS;
  }

  if (normalizedPath.endsWith("jobs/scrape")) {
    return ADMIN_PROXY_SCRAPE_TIMEOUT_MS;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return ADMIN_PROXY_WRITE_TIMEOUT_MS;
  }

  if (
    normalizedPath.endsWith("channels/facebook/posts") ||
    normalizedPath.endsWith("channels/facebook/publish")
  ) {
    return ADMIN_PROXY_WRITE_TIMEOUT_MS;
  }

  return ADMIN_PROXY_READ_TIMEOUT_MS;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const normalizedPath = path.join("/").replace(/^\/+|\/+$/g, "");
  const target = `${ADMIN_API_BASE_URL}/${normalizedPath}/${
    request.nextUrl.search ?? ""
  }`.replace(/\/\?/, "?");

  try {
    const headers = getAdminApiHeaders();
    const requestContentType = request.headers.get("content-type");
    if (requestContentType) {
      headers.set("content-type", requestContentType);
    }

    const accept = request.headers.get("accept");
    if (accept) {
      headers.set("accept", accept);
    }

    const lastEventId = request.headers.get("last-event-id");
    if (lastEventId) {
      headers.set("last-event-id", lastEventId);
    }

    const wantsEventStream =
      request.headers.get("accept")?.includes("text/event-stream") ||
      normalizedPath.endsWith("notifications/stream");
    const timeoutMs = getProxyTimeoutMs(request, normalizedPath);

    const requestBody =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : Buffer.from(await request.arrayBuffer());

    const response = await fetch(target, {
      method: request.method,
      cache: "no-store",
      signal: wantsEventStream ? undefined : AbortSignal.timeout(timeoutMs),
      headers,
      body: requestBody,
    });
    const contentType = response.headers.get("content-type") ?? "application/json";

    if (contentType.includes("text/event-stream")) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "content-type": contentType,
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        },
      });
    }

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { detail: "Proxy target timed out." },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { detail: "Proxy target is unavailable." },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}
