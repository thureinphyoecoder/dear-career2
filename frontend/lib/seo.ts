export function getSiteUrl() {
  const fallback =
    process.env.NODE_ENV === "production"
      ? "https://dear.thureinphyo.com"
      : "http://localhost:3000";
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    fallback;
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path: string) {
  const base = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function truncateForMeta(value: string, limit = 160) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) {
    return cleaned;
  }
  return `${cleaned.slice(0, limit - 1)}…`;
}
