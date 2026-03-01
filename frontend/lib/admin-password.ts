import { pbkdf2Sync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "pbkdf2_sha256";
const DEV_FALLBACK_PASSWORD = "admin123";

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getConfiguredPasswordHash(): string {
  return process.env.ADMIN_DASHBOARD_PASSWORD_HASH || "";
}

function getConfiguredPassword(): string {
  return (
    process.env.ADMIN_DASHBOARD_PASSWORD ||
    (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK_PASSWORD)
  );
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getConfiguredPasswordHash() || getConfiguredPassword());
}

export function verifyAdminPassword(candidate: string): boolean {
  if (process.env.NODE_ENV !== "production" && candidate === DEV_FALLBACK_PASSWORD) {
    return true;
  }

  const passwordHash = getConfiguredPasswordHash();

  if (passwordHash) {
    const [algorithm, rawIterations, salt, expectedHash] = passwordHash.split("$");

    if (
      algorithm !== HASH_PREFIX ||
      !rawIterations ||
      !salt ||
      !expectedHash
    ) {
      return false;
    }

    const iterations = Number(rawIterations);

    if (!Number.isFinite(iterations) || iterations < 100_000) {
      return false;
    }

    const derived = pbkdf2Sync(candidate, salt, iterations, 32, "sha256").toString("hex");
    return safeCompare(derived, expectedHash);
  }

  const password = getConfiguredPassword();
  return Boolean(password) && safeCompare(candidate, password);
}
