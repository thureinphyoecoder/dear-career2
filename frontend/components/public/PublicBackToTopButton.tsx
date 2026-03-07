"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function PublicBackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(116,141,122,0.28)] bg-[rgba(255,255,255,0.96)] text-[#3e5345] shadow-[0_14px_34px_rgba(120,140,126,0.22)] transition-colors hover:bg-white sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
