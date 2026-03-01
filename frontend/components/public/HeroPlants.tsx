"use client";

import { useEffect, useState } from "react";

import {
  SproutBase,
  SproutLeafLeft,
  SproutLeafRight,
  SproutStem,
} from "@/components/public/HeroSproutParts";

export function HeroPlants() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsLoaded(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="hero-svg-plants" aria-hidden="true">
      <div
        className={[
          "hero-sprout",
          "hero-sprout-single",
          isLoaded ? "is-loaded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SproutBase className="hero-sprout-mark hero-sprout-part hero-sprout-base" />
        <SproutStem className="hero-sprout-mark hero-sprout-part hero-sprout-stem" />
        <SproutLeafLeft className="hero-sprout-mark hero-sprout-part hero-sprout-leaf-left" />
        <SproutLeafRight className="hero-sprout-mark hero-sprout-part hero-sprout-leaf-right" />
      </div>
    </div>
  );
}
