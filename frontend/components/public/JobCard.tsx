import Link from "next/link";

import type { Job } from "@/lib/types";

const categoryLabelMap = {
  ngo: "NGO",
  "white-collar": "White Collar",
  "blue-collar": "Blue Collar",
};

export function JobCard({ job }: { job: Job }) {
  const initial = job.company.trim().charAt(0).toUpperCase() || "D";
  const summary =
    job.description_en ||
    job.description_mm ||
    "Curated opening with direct source details and a cleaner application path.";

  return (
    <article className="job-card stack">
      <div className="job-card-topline">
        <div className="job-source-badge">{job.source || "manual"}</div>
        <div className="pill">{job.employment_type}</div>
      </div>
      <div className="job-card-company-row">
        <div className="job-card-company-mark">{initial}</div>
        <div className="stack">
          <p className="job-card-company">{job.company}</p>
          <p className="job-card-location">{job.location}</p>
        </div>
      </div>
      <div className="job-card-meta">
        <span className="job-card-chip">{categoryLabelMap[job.category]}</span>
        <span className="job-card-chip">
          {job.source_url ? "Manual URL ready" : "Direct source link"}
        </span>
      </div>
      <div className="stack">
        <h3 className="job-card-title">{job.title}</h3>
        <p className="job-card-summary">{summary}</p>
      </div>
      <div className="job-card-salary">{job.salary || "Negotiable"}</div>
      <div className="job-card-meta">
        <span className="job-card-chip">Reviewed listing</span>
        <span className="job-card-chip">
          {job.source === "manual" ? "Manual source" : "Fetched source"}
        </span>
      </div>
      <Link href={`/jobs/${job.slug}`} className="job-card-button">
        View details
      </Link>
    </article>
  );
}
