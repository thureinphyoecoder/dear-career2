"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminLiveRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [intervalMs, router]);

  return null;
}
