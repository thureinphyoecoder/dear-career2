"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const ROUTE_TRANSITION_CLASS = "is-route-transitioning";

export function HomeExploreJobsButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);

  function handleClick() {
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);
    document.documentElement.classList.add(ROUTE_TRANSITION_CLASS);
    window.location.assign("/jobs?from=home");
  }

  return (
    <button
      type="button"
      className={className}
      aria-busy={isNavigating}
      disabled={isNavigating}
      data-no-hero-drag="true"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
