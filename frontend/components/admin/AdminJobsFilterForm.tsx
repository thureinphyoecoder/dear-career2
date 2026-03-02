"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminJobsFilterForm({
  initialQuery = "",
  initialStatus = "all",
}: {
  initialQuery?: string;
  initialStatus?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery && status === "all") {
      setError("Enter a search term or choose a status first.");
      inputRef.current?.focus();
      return;
    }

    const next = new URLSearchParams();
    if (trimmedQuery) {
      next.set("query", trimmedQuery);
    }
    if (status !== "all") {
      next.set("status", status);
    }

    const search = next.toString();
    router.push(search ? `/admin/jobs?${search}` : "/admin/jobs");
  }

  return (
    <div className="grid gap-2">
      <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center" onSubmit={handleSubmit} noValidate>
        <Input
          ref={inputRef}
          className="h-11 rounded-xl border-border/70 bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          name="query"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder="Search title, company, location, or source"
          aria-invalid={Boolean(error)}
        />
        <select
          className="h-11 min-w-[180px] rounded-xl border border-border/70 bg-white px-4 text-sm text-foreground shadow-none outline-none focus:border-[#8da693]"
          name="status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            if (error) {
              setError("");
            }
          }}
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="pending-review">Pending review</option>
        </select>
        <div className="flex flex-wrap gap-2">
          <button className={cn(buttonVariants(), "rounded-xl")} type="submit">
            Search
          </button>
          {(query.trim() || status !== "all") ? (
            <button
              type="button"
              className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl")}
              onClick={() => {
                setQuery("");
                setStatus("all");
                setError("");
                router.push("/admin/jobs");
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </form>
      {error ? <p className="text-sm text-[#8e4a4a]">{error}</p> : null}
    </div>
  );
}
