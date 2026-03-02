const DEV_FALLBACK_ADMIN_API_KEY = "dear-career-dev-admin-api";

export function getAdminApiKey(): string {
  const configured = process.env.ADMIN_API_SHARED_SECRET?.trim();
  if (configured) {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK_ADMIN_API_KEY;
}

export function getAdminApiHeaders(headers?: Headers): Headers {
  const nextHeaders = headers ? new Headers(headers) : new Headers();
  const adminApiKey = getAdminApiKey();

  if (adminApiKey) {
    nextHeaders.set("x-admin-api-key", adminApiKey);
  }

  return nextHeaders;
}
