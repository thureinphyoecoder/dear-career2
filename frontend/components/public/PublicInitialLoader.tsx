"use client";

import { useEffect, useState } from "react";

import { LoadingScreen } from "@/components/public/LoadingScreen";

const MIN_LOADER_MS = 480;

export function PublicInitialLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let pageLoaded = document.readyState === "complete";
    let minElapsed = false;

    const maybeHide = () => {
      if (pageLoaded && minElapsed) {
        setVisible(false);
      }
    };

    const minTimer = window.setTimeout(() => {
      minElapsed = true;
      maybeHide();
    }, MIN_LOADER_MS);

    const onLoad = () => {
      pageLoaded = true;
      maybeHide();
    };

    if (!pageLoaded) {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      window.clearTimeout(minTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return <LoadingScreen />;
}
