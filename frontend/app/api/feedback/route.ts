import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_BASE_URL =
  process.env.DJANGO_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000/api";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/jobs/feedback/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Feedback service is unavailable." },
      { status: 502 },
    );
  }
}
