"use client";

import { useEffect, useRef, useState } from "react";

function fadeOut(progress: number, start: number, end: number) {
  if (progress <= start) return 1;
  if (progress >= end) return 0;
  return 1 - (progress - start) / Math.max(end - start, 0.0001);
}

export function HeroPlants() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tintOpacity = 0.62;
  const [partOpacity, setPartOpacity] = useState({
    ground: 1,
    stem: 1,
    leafLeft: 1,
    leafRight: 1,
  });

  useEffect(() => {
    const target = containerRef.current;
    if (!target) {
      return;
    }

    const updatePartOpacity = () => {
      const scene = target.closest(".hero-scene");
      if (!scene) {
        return;
      }

      const rect = scene.getBoundingClientRect();
      const scrollProgress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * 0.72, 1)));
      setPartOpacity({
        // Scroll down order: right leaf -> left leaf -> stem -> ground
        leafRight: fadeOut(scrollProgress, 0.04, 0.22),
        leafLeft: fadeOut(scrollProgress, 0.20, 0.40),
        stem: fadeOut(scrollProgress, 0.38, 0.60),
        ground: fadeOut(scrollProgress, 0.58, 0.82),
      });
    };

    updatePartOpacity();
    window.addEventListener("scroll", updatePartOpacity, { passive: true });
    window.addEventListener("resize", updatePartOpacity);

    return () => {
      window.removeEventListener("scroll", updatePartOpacity);
      window.removeEventListener("resize", updatePartOpacity);
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-svg-plants" aria-hidden="true">
      <div className="hero-sprout hero-sprout-single">
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-ground ${partOpacity.ground > 0.02 ? "is-active" : ""}`}
          style={{ opacity: partOpacity.ground * tintOpacity }}
        />
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-stem ${partOpacity.stem > 0.02 ? "is-active" : ""}`}
          style={{ opacity: partOpacity.stem * tintOpacity }}
        />
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-leaf-left ${partOpacity.leafLeft > 0.02 ? "is-active" : ""}`}
          style={{ opacity: partOpacity.leafLeft * tintOpacity }}
        />
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-leaf-right ${partOpacity.leafRight > 0.02 ? "is-active" : ""}`}
          style={{ opacity: partOpacity.leafRight * tintOpacity }}
        />
      </div>
    </div>
  );
}
