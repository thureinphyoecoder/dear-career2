import Link from "next/link";

import { JobTable } from "@/components/admin/JobTable";
import { getAdminJobs } from "@/lib/api-admin";

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Job CRUD</div>
          <h1 className="admin-page-title">Jobs</h1>
          <p className="admin-page-copy">
            Review listings, update metadata, and control publish readiness.
          </p>
        </div>
        <div className="admin-header-actions">
          <input className="field" placeholder="Search title or company" />
          <select className="select" defaultValue="all" style={{ minWidth: 180 }}>
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
