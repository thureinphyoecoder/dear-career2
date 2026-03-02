import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/types";

const categoryLabelMap = {
  ngo: "NGO",
  "white-collar": "White Collar",
  "blue-collar": "Blue Collar",
};

export function JobCard({ job }: { job: Job }) {
  const summary =
    job.description_en ||
    job.description_mm ||
    "Curated opening with direct source details and a cleaner application path.";

  return (
    <Card className="h-full rounded-[1.75rem] border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.8)] shadow-none backdrop-blur-0 transition-colors hover:border-[rgba(160,183,164,0.28)]">
      <CardContent className="grid h-full gap-4 p-5 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{categoryLabelMap[job.category]}</Badge>
          <Badge variant="secondary">{job.employment_type}</Badge>
          <span className="text-xs uppercase tracking-[0.14em] text-[#8da693]">
            {job.source || "manual"}
          </span>
        </div>

        <div className="grid gap-1">
          <h3 className="m-0 text-[1.15rem] font-semibold leading-[1.35] text-foreground">
            {job.title}
          </h3>
          <p className="m-0 text-sm leading-6 text-[#454c49]">
            {job.company} <span className="text-[#b7b1a6]">/</span> {job.location}
          </p>
        </div>

        <p className="m-0 text-sm leading-7 text-[#727975]">{summary}</p>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[rgba(160,183,164,0.12)] pt-4">
          <div className="grid gap-1">
            <div className="text-xs uppercase tracking-[0.14em] text-[#8da693]">Salary</div>
            <div className="text-sm font-medium text-foreground">{job.salary || "Negotiable"}</div>
          </div>
          <Link
            href={`/jobs/${job.slug}`}
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
