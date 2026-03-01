import Link from "next/link";

import { getAdminJobs } from "@/lib/api-admin";

export default async function AdminDashboardPage() {
  const jobs = await getAdminJobs();
  const djangoAdminUrl =
    process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL ?? "http://127.0.0.1:8000/admin/";

  return (
    <div className="stack">
      <section className="admin-notice card card-pad">
        <div className="stack">
          <div className="eyebrow">Authentication</div>
          <h1 className="section-title" style={{ marginBottom: 0 }}>
            This screen is now protected by frontend admin sign-in.
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Dear Career admin routes use their own session middleware and
            dashboard credentials. Django credentials still apply only on the
            backend admin route.
          </p>
          <div className="toolbar">
            <a
              href={djangoAdminUrl}
              target="_blank"
              rel="noreferrer"
              className="button"
            >
              Open Django admin login
            </a>
          </div>
        </div>
      </section>
      <div className="toolbar">
        <div>
          <div className="eyebrow">Dashboard overview</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Admin
          </h2>
        </div>
        <Link href="/admin/jobs/new" className="button">
          New job
        </Link>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <section className="card card-pad stack">
          <span className="muted">Total jobs</span>
          <strong style={{ fontSize: "2rem" }}>{jobs.length}</strong>
        </section>
        <section className="card card-pad stack">
          <span className="muted">Published</span>
          <strong style={{ fontSize: "2rem" }}>
            {jobs.filter((job) => job.is_active !== false).length}
          </strong>
        </section>
        <section className="card card-pad stack">
          <span className="muted">Sources</span>
          <strong style={{ fontSize: "2rem" }}>
            {new Set(jobs.map((job) => job.source).filter(Boolean)).size}
          </strong>
        </section>
      </div>
    </div>
  );
}
