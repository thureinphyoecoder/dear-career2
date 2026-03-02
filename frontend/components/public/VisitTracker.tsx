"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_STORAGE_KEY = "dear-career-visitor-session";
const VISIT_PREFIX = "dear-career-visit";

function getSessionKey() {
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
}

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const today = new Date().toISOString().slice(0, 10);
    const markerKey = `${VISIT_PREFIX}:${today}:${pathname}`;
    if (window.sessionStorage.getItem(markerKey)) {
      return;
    }

    const sessionKey = getSessionKey();
    window.sessionStorage.setItem(markerKey, "1");

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        session_key: sessionKey,
        path: pathname,
        page_title: document.title,
      }),
    }).catch(() => {
      window.sessionStorage.removeItem(markerKey);
    });
  }, [pathname]);

  return null;
}
