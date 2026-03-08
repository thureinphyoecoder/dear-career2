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
  const [scrollPartOpacity, setScrollPartOpacity] = useState({
    ground: 1,
    stem: 1,
    leafLeft: 1,
    leafRight: 1,
  });
  const [introPartOpacity, setIntroPartOpacity] = useState({
    ground: 0,
    stem: 0,
    leafLeft: 0,
    leafRight: 0,
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIntroPartOpacity({
        ground: 1,
        stem: 1,
        leafLeft: 1,
        leafRight: 1,
      });
      return;
    }

    const timers: number[] = [];
    timers.push(
      window.setTimeout(
        () => setIntroPartOpacity((current) => ({ ...current, ground: 1 })),
        120,
      ),
    );
    timers.push(
      window.setTimeout(
        () => setIntroPartOpacity((current) => ({ ...current, stem: 1 })),
        360,
      ),
    );
    timers.push(
      window.setTimeout(
        () => setIntroPartOpacity((current) => ({ ...current, leafLeft: 1 })),
        620,
      ),
    );
    timers.push(
      window.setTimeout(
        () => setIntroPartOpacity((current) => ({ ...current, leafRight: 1 })),
        860,
      ),
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

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
      setScrollPartOpacity({
        // Scroll down order: right leaf -> left leaf -> stem -> ground
        leafRight: fadeOut(scrollProgress, 0.04, 0.18),
        leafLeft: fadeOut(scrollProgress, 0.21, 0.36),
        stem: fadeOut(scrollProgress, 0.39, 0.55),
        ground: fadeOut(scrollProgress, 0.58, 0.76),
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
          className={`hero-logo-part hero-sprout-part hero-logo-ground ${introPartOpacity.ground > 0.02 && scrollPartOpacity.ground > 0.02 ? "is-active" : ""}`}
          style={{ opacity: introPartOpacity.ground * scrollPartOpacity.ground * tintOpacity }}
        />
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-stem ${introPartOpacity.stem > 0.02 && scrollPartOpacity.stem > 0.02 ? "is-active" : ""}`}
          style={{ opacity: introPartOpacity.stem * scrollPartOpacity.stem * tintOpacity }}
        />
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-leaf-left ${introPartOpacity.leafLeft > 0.02 && scrollPartOpacity.leafLeft > 0.02 ? "is-active" : ""}`}
          style={{ opacity: introPartOpacity.leafLeft * scrollPartOpacity.leafLeft * tintOpacity }}
        />
        <img
          src="/logoflat.svg"
          alt=""
          className={`hero-logo-part hero-sprout-part hero-logo-leaf-right ${introPartOpacity.leafRight > 0.02 && scrollPartOpacity.leafRight > 0.02 ? "is-active" : ""}`}
          style={{ opacity: introPartOpacity.leafRight * scrollPartOpacity.leafRight * tintOpacity }}
        />
      </div>
    </div>
  );
}
