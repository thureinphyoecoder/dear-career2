import Link from "next/link";

import { JobTable } from "@/components/admin/JobTable";
import { getAdminJobs } from "@/lib/api-admin";

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <div className="eyebrow">List and filters</div>
          <h1 style={{ marginBottom: 0 }}>Jobs</h1>
        </div>
        <div className="toolbar">
          <input className="field" placeholder="Search title or company" />
          <select className="select" defaultValue="all">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Link href="/admin/jobs/new" className="button">
            Create job
          </Link>
        </div>
      </div>
      <JobTable jobs={jobs} />
    </div>
  );
}
