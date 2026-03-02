"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function HeroSearchForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="hero-search flex flex-col items-stretch gap-3 lg:flex-row"
      action="/jobs"
      method="get"
    >
      <label className="relative block flex-1" htmlFor="hero-search-input">
        <span
          className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-[#727975]/82"
          aria-hidden="true"
        >
          <SearchIcon />
        </span>
        <Input
          ref={inputRef}
          id="hero-search-input"
          name="q"
          type="search"
          className="h-[68px] border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.68)] pl-14 pr-5 text-base shadow-soft backdrop-blur-xl placeholder:text-[#727975]/70"
          placeholder="Search jobs in Thailand"
          autoComplete="off"
        />
      </label>
      <Button
        type="submit"
        size="lg"
        className="h-[68px] px-6"
      >
        Search jobs
      </Button>
    </form>
  );
}
