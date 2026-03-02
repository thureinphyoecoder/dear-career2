import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/analytics/visit/`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: await request.text(),
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ detail: "Analytics target is unavailable." }, { status: 502 });
  }
}
