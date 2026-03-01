const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type RateRecord = {
  count: number;
  windowStartedAt: number;
  lockedUntil?: number;
};

const attempts = new Map<string, RateRecord>();

function getNow() {
  return Date.now();
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function buildAdminRateLimitKey(ip: string, username: string) {
  return `${normalizeKey(ip)}:${normalizeKey(username)}`;
}

export function getAdminRateLimitState(key: string) {
  const now = getNow();
  const current = attempts.get(key);

  if (!current) {
    return { allowed: true as const, remaining: MAX_ATTEMPTS };
  }

  if (current.lockedUntil && current.lockedUntil > now) {
    return {
      allowed: false as const,
      retryAfterMs: current.lockedUntil - now,
      remaining: 0,
    };
  }

  if (now - current.windowStartedAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true as const, remaining: MAX_ATTEMPTS };
  }

  return {
    allowed: true as const,
    remaining: Math.max(0, MAX_ATTEMPTS - current.count),
  };
}

export function registerAdminLoginFailure(key: string) {
  const now = getNow();
  const current = attempts.get(key);

  if (!current || now - current.windowStartedAt > WINDOW_MS) {
    attempts.set(key, {
      count: 1,
      windowStartedAt: now,
    });
    return;
  }

  const count = current.count + 1;
  attempts.set(key, {
    count,
    windowStartedAt: current.windowStartedAt,
    lockedUntil: count >= MAX_ATTEMPTS ? now + LOCK_MS : current.lockedUntil,
  });
}

export function clearAdminLoginFailures(key: string) {
  attempts.delete(key);
}
