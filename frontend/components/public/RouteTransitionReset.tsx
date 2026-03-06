"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ROUTE_TRANSITION_CLASS = "is-route-transitioning";

export function RouteTransitionReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.remove(ROUTE_TRANSITION_CLASS);

    if (pathname !== "/jobs") {
      return;
    }

    if (!searchParams.has("from")) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("from");
    const query = next.toString();
    const nextHref = query ? `${pathname}?${query}` : pathname;
    router.replace(nextHref, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
