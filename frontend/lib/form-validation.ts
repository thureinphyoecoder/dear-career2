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
    return (parsed.detail || parsed.error || parsed.message || fallback).trim();
  } catch {
    return trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || fallback;
  }
}
