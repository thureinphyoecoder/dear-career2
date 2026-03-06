"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type ParallaxState = {
  dragX: number;
  dragY: number;
  scrollY: number;
};

const DRAG_X_RANGE = 34;
const DRAG_Y_RANGE = 24;
const SCROLL_Y_RANGE = 120;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HeroParallaxScene({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  const sceneRef = useRef<HTMLElement | null>(null);
  const stateRef = useRef<ParallaxState>({ dragX: 0, dragY: 0, scrollY: 0 });
  const reducedMotionRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const applyState = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }

    const { dragX, dragY, scrollY } = stateRef.current;
    scene.style.setProperty("--hero-drag-x", `${dragX.toFixed(2)}px`);
    scene.style.setProperty("--hero-drag-y", `${dragY.toFixed(2)}px`);
    scene.style.setProperty("--hero-scroll-y", `${scrollY.toFixed(2)}px`);
  }, []);

  const updateScroll = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene || reducedMotionRef.current) {
      stateRef.current.scrollY = 0;
      applyState();
      return;
    }

    const rect = scene.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
    stateRef.current.scrollY = -progress * SCROLL_Y_RANGE;
    applyState();
  }, [applyState]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    updateScroll();

    const onScroll = () => updateScroll();
    const onResize = () => updateScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateScroll]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || reducedMotionRef.current) {
      return;
    }

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!isDragging || reducedMotionRef.current) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    stateRef.current.dragX = clamp(normalizedX, -1, 1) * DRAG_X_RANGE;
    stateRef.current.dragY = clamp(normalizedY, -1, 1) * DRAG_Y_RANGE;
    applyState();
  }, [applyState, isDragging]);

  const endDragging = useCallback(() => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    stateRef.current.dragX = 0;
    stateRef.current.dragY = 0;
    applyState();
  }, [applyState, isDragging]);

  return (
    <section
      id={id}
      ref={sceneRef}
      className={isDragging ? "hero-scene is-dragging" : "hero-scene"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDragging}
      onPointerCancel={endDragging}
      onPointerLeave={endDragging}
    >
      {children}
    </section>
  );
}
