export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeServerError(detail: string, fallback: string) {
  const trimmed = detail.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = JSON.parse(detail) as { detail?: string; error?: string; message?: string };
    const message = (parsed.detail || parsed.error || parsed.message || fallback).trim();
    return message || fallback;
  } catch {
    const normalized = trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const lower = trimmed.toLowerCase();
    if (
      normalized.includes("APPEND_SLASH") ||
      normalized.includes("trailing slash") ||
      lower.includes("<!doctype html>") ||
      lower.includes("<html") ||
      normalized.includes("Traceback") ||
      normalized.includes("RuntimeError at")
    ) {
      return fallback;
    }
    return normalized || fallback;
  }
}
