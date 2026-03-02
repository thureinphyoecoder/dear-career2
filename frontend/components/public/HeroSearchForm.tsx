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
      className="hero-search"
      action="/jobs"
      method="get"
    >
      <div className="flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.14)] p-2 backdrop-blur-[2px]">
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
            className="h-[60px] border-0 bg-transparent pl-14 pr-5 text-base shadow-none ring-0 placeholder:text-[#727975]/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Search jobs in Thailand"
            autoComplete="off"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          variant="ghost"
          className="h-[60px] rounded-full bg-[rgba(255,255,255,0.2)] px-6 hover:bg-[rgba(255,255,255,0.28)]"
        >
          Search jobs
        </Button>
      </div>
    </form>
  );
}
