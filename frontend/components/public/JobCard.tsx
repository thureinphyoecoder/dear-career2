"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

const categoryLabelMap = {
  ngo: "NGO",
  "white-collar": "White Collar",
  "blue-collar": "Blue Collar",
};

function formatRelativeTime(value?: string) {
  if (!value) return "Recently posted";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently posted";

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function JobCard({ job }: { job: Job }) {
  const summary = useMemo(
    () =>
      job.description_en ||
      job.description_mm ||
      "Curated opening with direct source details and a cleaner application path.",
    [job.description_en, job.description_mm],
  );
  const sourceLabel =
    job.source && job.source.toLowerCase() !== "manual" ? job.source : null;
  const [isViewed, setIsViewed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsViewed(window.localStorage.getItem(`viewed-job:${job.id}`) === "1");
  }, [job.id]);

  function markViewed() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`viewed-job:${job.id}`, "1");
    setIsViewed(true);
  }

  return (
    <Card className="h-full rounded-[1.75rem] border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.8)] shadow-none backdrop-blur-0 transition-colors hover:border-[rgba(160,183,164,0.28)]">
      <CardContent className="grid h-full gap-4 p-5 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{categoryLabelMap[job.category]}</Badge>
          <Badge variant="secondary">{job.employment_type}</Badge>
          {sourceLabel ? (
            <span className="text-[0.72rem] uppercase tracking-[0.14em] text-[#8da693]">
              {sourceLabel}
            </span>
          ) : null}
        </div>

        <div className="grid gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h3 className="m-0 text-[1.15rem] font-semibold leading-[1.35] text-foreground">
                {job.title}
              </h3>
            </div>
            <div className="grid justify-items-end gap-2 text-right">
              <span className="text-[0.74rem] leading-none text-[#8a928d]">
                {formatRelativeTime(job.created_at)}
              </span>
              {isViewed ? (
                <span className="rounded-full bg-[rgba(160,183,164,0.12)] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[#6f8574]">
                  Viewed
                </span>
              ) : null}
            </div>
          </div>
          <p className="m-0 text-sm leading-6 text-[#454c49]">
            {job.company} <span className="text-[#b7b1a6]">/</span> {job.location}
          </p>
          <div className="flex items-center gap-2 text-[0.78rem] text-[#8a928d]">
            {job.source_url ? <span>Direct source</span> : null}
          </div>
        </div>

        <p className="m-0 line-clamp-3 text-[0.96rem] leading-7 text-[#727975]">
          {summary}
        </p>

        <div className="mt-auto flex items-end justify-end gap-4 border-t border-[rgba(160,183,164,0.12)] pt-4">
          <Link
            href={`/jobs/${job.slug}`}
            onClick={markViewed}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.16)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[rgba(160,183,164,0.08)]",
            )}
          >
            View details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
