import Link from "next/link";

import { StatusPill } from "@/components/admin/StatusPill";
import type { Job } from "@/lib/types";

export function JobTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="card card-pad">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Company</th>
            <th>Location</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted">
                No jobs yet.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.company}</td>
                <td>{job.location}</td>
                <td>
                  <StatusPill status={job.status ?? "published"} />
                </td>
                <td>
                  <Link href={`/admin/jobs/${job.id}`}>Open</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
