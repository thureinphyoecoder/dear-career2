"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function JobsSearchForm({
  initialQuery = "",
  category = "",
  autoFocus = false,
  buttonLabel = "Search",
  formClassName,
  shellClassName,
  inputClassName,
  buttonClassName,
  errorClassName,
}: {
  initialQuery?: string;
  category?: string;
  autoFocus?: boolean;
  buttonLabel?: string;
  formClassName?: string;
  shellClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  errorClassName?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState("");

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Enter a search term first.");
      inputRef.current?.focus();
      return;
    }

    const next = new URLSearchParams();
    next.set("q", trimmedQuery);
    if (category) {
      next.set("category", category);
    }

    router.push(`/jobs?${next.toString()}`);
  }

  return (
    <form className={cn("grid gap-2", formClassName)} onSubmit={handleSubmit} noValidate>
      <div className={cn("flex items-center gap-2", shellClassName)}>
        <label className="relative block flex-1" htmlFor="jobs-search-input">
          <span
            className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-[#727975]/82"
            aria-hidden="true"
          >
            <Search size={16} strokeWidth={1.9} />
          </span>
          <Input
            ref={inputRef}
            id="jobs-search-input"
            name="q"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) {
                setError("");
              }
            }}
            className={cn(inputClassName, "!pl-14")}
            placeholder="Search jobs in Thailand"
            autoComplete="off"
            aria-invalid={Boolean(error)}
          />
        </label>
        <Button type="submit" size="lg" variant="ghost" className={buttonClassName}>
          {buttonLabel}
        </Button>
      </div>
      {error ? <p className={cn("text-sm text-[#8e4a4a]", errorClassName)}>{error}</p> : null}
    </form>
  );
}
