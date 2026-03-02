import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const hasTrailingSlash = request.nextUrl.pathname.endsWith("/");
  const target = `${ADMIN_API_BASE_URL}/${path.join("/")}${hasTrailingSlash ? "/" : ""}`;

  try {
    const headers = new Headers();
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");

    const accept = request.headers.get("accept");
    if (accept) {
      headers.set("accept", accept);
    }

    const lastEventId = request.headers.get("last-event-id");
    if (lastEventId) {
      headers.set("last-event-id", lastEventId);
    }

    const response = await fetch(target, {
      method: request.method,
      cache: "no-store",
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
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
  } catch {
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
