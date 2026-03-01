import Link from "next/link";

import { StatusPill } from "@/components/admin/StatusPill";
import type { Job } from "@/lib/types";

function formatCategory(category: Job["category"]) {
  return category.replace("-", " ");
}

function formatDate(value?: string) {
  if (!value) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function JobTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="admin-table-shell">
      <div className="admin-table-toolbar">
        <div>
          <div className="eyebrow">Job CRUD</div>
          <h2 className="admin-panel-title">Listings</h2>
        </div>
        <span className="admin-table-count">{jobs.length} records</span>
      </div>

      <div className="admin-table-wrap">
        <table className="table admin-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Category</th>
              <th>Source</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-cell">
                  No jobs yet. Create a listing or queue a fetch source first.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="admin-job-cell">
                      <strong>{job.title}</strong>
                      <span>
                        {job.company} · {job.location || "Thailand"}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table-caps">{formatCategory(job.category)}</td>
                  <td>{job.source || "manual"}</td>
                  <td>
                    <StatusPill status={job.status ?? "published"} />
                  </td>
                  <td>{formatDate(job.updated_at ?? job.created_at)}</td>
                  <td>
                    <Link className="admin-row-link" href={`/admin/jobs/${job.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
