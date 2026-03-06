"use client";

import { useEffect } from "react";

const ROUTE_TRANSITION_CLASS = "is-route-transitioning";

export function RouteTransitionReset() {
  useEffect(() => {
    document.documentElement.classList.remove(ROUTE_TRANSITION_CLASS);
  }, []);

  return null;
}
