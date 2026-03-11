"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, Clock3, Eye, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { extractJobSummary } from "@/lib/job-content";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";
import { PublicJobImage } from "@/components/public/PublicJobImage";

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
  const summary = extractJobSummary(job);
  const displayImageUrl = job.display_image_url || job.image_file_url || job.image_url || "";
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
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[1.65rem] transition-all duration-300 hover:-translate-y-1",
        isViewed
          ? "border-[rgba(116,141,122,0.3)] bg-[linear-gradient(150deg,rgba(244,249,243,0.98),rgba(231,240,232,0.92))] shadow-[0_10px_26px_rgba(106,128,112,0.14)] hover:border-[rgba(99,124,107,0.42)] hover:shadow-[0_18px_36px_rgba(106,128,112,0.2)]"
          : "border-[rgba(132,157,138,0.2)] bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(245,248,242,0.8))] shadow-[0_12px_30px_rgba(119,145,125,0.1)] hover:border-[rgba(116,141,122,0.34)] hover:shadow-[0_20px_40px_rgba(119,145,125,0.16)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-16",
          isViewed
            ? "bg-[linear-gradient(180deg,rgba(116,141,122,0.2),transparent)]"
            : "bg-[linear-gradient(180deg,rgba(160,183,164,0.14),transparent)]",
        )}
      />
      <CardContent className="relative grid gap-4 p-5 pt-5">
        <PublicJobImage
          src={displayImageUrl}
          title={job.title}
          company={job.company}
          alt={job.title}
          wrapperClassName="rounded-[1.2rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(247,243,236,0.42)]"
          imageClassName="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          fallbackClassName="aspect-[16/10] p-6"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoryLabelMap[job.category]}</Badge>
            <Badge variant="secondary">{job.employment_type}</Badge>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.84)] px-2.5 py-1 text-[0.72rem] leading-none text-[#66726d]">
              <Clock3 className="h-3.5 w-3.5" />
              {formatRelativeTime(job.created_at)}
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="m-0 text-[1.2rem] font-semibold leading-[1.32] text-foreground">
            {job.title}
          </h3>
          <div className="grid gap-1 text-sm text-[#4a5650]">
            <p className="m-0 inline-flex items-center gap-1.5 leading-6">
              <Building2 className="h-4 w-4 text-[#7a8d7f]" />
              {job.company}
            </p>
            <p className="m-0 inline-flex items-center gap-1.5 leading-6">
              <MapPin className="h-4 w-4 text-[#7a8d7f]" />
              {job.location}
            </p>
          </div>
        </div>

        <p className="m-0 line-clamp-3 text-[0.95rem] leading-7 text-[#6c7672]">
          {summary}
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[rgba(160,183,164,0.12)] pt-4">
          <div>
            {isViewed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(116,141,122,0.34)] bg-[rgba(216,231,219,0.92)] px-3.5 py-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-[#35503f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.42)]">
                <Eye className="h-3.5 w-3.5" />
                Viewed
              </span>
            ) : null}
          </div>
          <Link
            href={`/jobs/${job.slug}`}
            onClick={markViewed}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-[rgba(116,141,122,0.24)] bg-[rgba(247,243,236,0.66)] px-4 py-2 text-sm font-medium text-[#3f4b45] transition-all hover:border-[rgba(116,141,122,0.36)] hover:bg-[rgba(160,183,164,0.12)]",
            )}
          >
            View details
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
