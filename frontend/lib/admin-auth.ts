const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "dear_career_admin_session";
const DEFAULT_DURATION_HOURS = 12;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_DASHBOARD_USERNAME ?? "",
    password: process.env.ADMIN_DASHBOARD_PASSWORD ?? "",
  };
}

export function isAdminAuthConfigured(): boolean {
  const { username, password } = getAdminCredentials();
  return Boolean(username && password && getSessionSecret());
}

export function getSessionDurationMs(): number {
  const rawDuration = Number(process.env.ADMIN_SESSION_DURATION_HOURS ?? DEFAULT_DURATION_HOURS);
  const hours = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : DEFAULT_DURATION_HOURS;
  return hours * 60 * 60 * 1000;
}

async function signValue(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toHex(signature);
}

export async function createAdminSessionToken(username: string): Promise<string> {
  const expiresAt = Date.now() + getSessionDurationMs();
  const payload = `${encodeURIComponent(username)}.${expiresAt}`;
  const signature = await signValue(payload);
  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<{ valid: boolean; username?: string }> {
  if (!token || !isAdminAuthConfigured()) {
    return { valid: false };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false };
  }

  const [encodedUsername, rawExpiresAt, signature] = parts;
  const expiresAt = Number(rawExpiresAt);

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return { valid: false };
  }

  const payload = `${encodedUsername}.${rawExpiresAt}`;
  const expectedSignature = await signValue(payload);

  if (expectedSignature !== signature) {
    return { valid: false };
  }

  return {
    valid: true,
    username: decodeURIComponent(encodedUsername),
  };
}
