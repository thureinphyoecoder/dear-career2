"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
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
  liveSearch = false,
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
  liveSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!liveSearch || pathname !== "/jobs") {
      return;
    }

    const trimmedQuery = deferredQuery.trim();
    const current = new URLSearchParams(searchParams.toString());
    const next = new URLSearchParams(searchParams.toString());

    if (trimmedQuery) {
      next.set("q", trimmedQuery);
    } else {
      next.delete("q");
    }

    if (category) {
      next.set("category", category);
    } else {
      next.delete("category");
    }

    next.delete("from");

    if (next.toString() === current.toString()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextHref = next.toString() ? `/jobs?${next.toString()}` : "/jobs";
      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [category, deferredQuery, liveSearch, pathname, router, searchParams]);

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
    next.delete("from");

    router.push(`/jobs?${next.toString()}`);
  }

  return (
    <form
      className={cn("grid gap-2", formClassName)}
      action="/jobs"
      method="get"
      onSubmit={handleSubmit}
      noValidate
    >
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", shellClassName)}>
        <label className="relative block w-full flex-1" htmlFor="jobs-search-input">
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
        <Button type="submit" size="lg" variant="ghost" className={cn("w-full sm:w-auto", buttonClassName)}>
          {buttonLabel}
        </Button>
      </div>
      {error ? <p className={cn("text-sm text-[#8e4a4a]", errorClassName)}>{error}</p> : null}
    </form>
  );
}
