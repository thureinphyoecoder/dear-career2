import { normalizeServerError } from "@/lib/form-validation";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type AdminRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  json?: JsonObject;
  body?: BodyInit;
  fallbackError: string;
};

export async function requestAdmin<T>(
  url: string,
  { method = "GET", json, body, fallbackError }: AdminRequestOptions,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: json ? { "content-type": "application/json" } : undefined,
    body: json ? JSON.stringify(json) : body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(normalizeServerError(detail, fallbackError));
  }

  return (await response.json()) as T;
}

export async function requestAdminNoContent(
  url: string,
  { method = "DELETE", json, body, fallbackError }: AdminRequestOptions,
): Promise<void> {
  const response = await fetch(url, {
    method,
    headers: json ? { "content-type": "application/json" } : undefined,
    body: json ? JSON.stringify(json) : body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(normalizeServerError(detail, fallbackError));
  }
}
