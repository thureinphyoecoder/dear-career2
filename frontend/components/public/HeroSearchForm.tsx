"use client";

import { useEffect, useRef } from "react";

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
    <form className="hero-search" action="/jobs" method="get">
      <label className="hero-search-field hero-search-field-single" htmlFor="hero-search-input">
        <span className="hero-search-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          id="hero-search-input"
          name="q"
          type="search"
          className="hero-search-input"
          placeholder="Search jobs in Thailand"
          autoComplete="off"
        />
      </label>
      <button type="submit" className="button hero-search-button">
        Search jobs
      </button>
    </form>
  );
}
