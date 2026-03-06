"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import {
  SproutBase,
  SproutLeafLeft,
  SproutLeafRight,
  SproutStem,
} from "@/components/public/HeroSproutParts";
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
      return;
    }

    const update = () => {
      const scrollY = window.scrollY;
      const progress = clamp(scrollY / MAX_PROGRESS_SCROLL, 0, 1);
      const parallaxY = clamp(scrollY * 0.08, 0, 52);

      scene.style.setProperty("--jobs-progress", progress.toFixed(4));
      scene.style.setProperty("--jobs-parallax-y", `${parallaxY.toFixed(2)}px`);
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

          <div className="jobs-transition-sprout jobs-transition-sprout-left">
            <SproutBase className="jobs-transition-sprout-mark" />
            <SproutStem className="jobs-transition-sprout-mark" />
            <SproutLeafLeft className="jobs-transition-sprout-mark" />
            <SproutLeafRight className="jobs-transition-sprout-mark" />
          </div>

          <div className="jobs-transition-sprout jobs-transition-sprout-right">
            <SproutBase className="jobs-transition-sprout-mark" />
            <SproutStem className="jobs-transition-sprout-mark" />
            <SproutLeafLeft className="jobs-transition-sprout-mark" />
            <SproutLeafRight className="jobs-transition-sprout-mark" />
          </div>
        </div>
      ) : null}

      <div className="jobs-parallax-content">{children}</div>
    </div>
  );
}
