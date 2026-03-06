"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ROUTE_TRANSITION_CLASS = "is-route-transitioning";
const ROUTE_DELAY_MS = 420;

export function HomeExploreJobsButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleClick() {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);
    document.documentElement.classList.add(ROUTE_TRANSITION_CLASS);
    window.setTimeout(() => {
      router.push("/jobs?from=home");
    }, ROUTE_DELAY_MS);
  }

  return (
    <button
      type="button"
      className={className}
      aria-busy={isNavigating}
      disabled={isNavigating}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
