"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const MAX_PROGRESS_SCROLL = 760;

type JobsParallaxSceneProps = {
  children: ReactNode;
  fromHome?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function JobsParallaxScene({ children, fromHome = false }: JobsParallaxSceneProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !fromHome) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      scene.style.setProperty("--jobs-progress", "1");
      scene.style.setProperty("--jobs-parallax-y", "0px");
      scene.style.setProperty("--jobs-base-progress", "1");
      scene.style.setProperty("--jobs-stem-progress", "1");
      scene.style.setProperty("--jobs-leaf-left-progress", "1");
      scene.style.setProperty("--jobs-leaf-right-progress", "1");
      return;
    }

    const update = () => {
      const rect = scene.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const normalizedEntry = clamp((viewportHeight - rect.top) / Math.max(viewportHeight + rect.height, 1), 0, 1);
      const globalProgress = clamp(window.scrollY / MAX_PROGRESS_SCROLL, 0, 1);
      const progress = clamp((normalizedEntry + globalProgress) * 0.56, 0, 1);
      const parallaxY = clamp((viewportHeight - rect.top) * 0.09, 0, 56);
      const baseProgress = clamp(progress / 0.28, 0, 1);
      const stemProgress = clamp((progress - 0.1) / 0.28, 0, 1);
      const leafLeftProgress = clamp((progress - 0.22) / 0.3, 0, 1);
      const leafRightProgress = clamp((progress - 0.34) / 0.32, 0, 1);

      scene.style.setProperty("--jobs-progress", progress.toFixed(4));
      scene.style.setProperty("--jobs-parallax-y", `${parallaxY.toFixed(2)}px`);
      scene.style.setProperty("--jobs-base-progress", baseProgress.toFixed(4));
      scene.style.setProperty("--jobs-stem-progress", stemProgress.toFixed(4));
      scene.style.setProperty("--jobs-leaf-left-progress", leafLeftProgress.toFixed(4));
      scene.style.setProperty("--jobs-leaf-right-progress", leafRightProgress.toFixed(4));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [fromHome]);

  return (
    <div
      ref={sceneRef}
      className={cn("jobs-parallax-scene", fromHome ? "is-from-home" : "is-plain")}
    >
      {fromHome ? (
        <div className="jobs-transition-backdrop" aria-hidden="true">
          <div className="jobs-transition-orb jobs-transition-orb-left" />
          <div className="jobs-transition-orb jobs-transition-orb-right" />
          <div className="jobs-transition-curve jobs-transition-curve-left" />
          <div className="jobs-transition-curve jobs-transition-curve-right" />
        </div>
      ) : null}

      <div className="jobs-parallax-content">{children}</div>
    </div>
  );
}
